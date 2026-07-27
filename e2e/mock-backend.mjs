/**
 * Deterministic stand-in for the two external dependencies: the Ponder GraphQL
 * indexer and the Sepolia JSON-RPC endpoints.
 *
 * Without this the e2e suite depends on live testnet RPC and a locally running
 * indexer, which makes it slow, flaky, and unable to assert anything about the
 * contents of a table. It also keeps the historical `eth_getLogs` scan out of
 * the test server, which is otherwise heavy enough to be killed mid-run.
 *
 *   node e2e/mock-backend.mjs [port]
 *
 * Routes:
 *   POST /graphql  → Ponder queries (fheHandles, aclGrants, confidentialTransfers,
 *                    unwrapRequests)
 *   POST /rpc/arb   → Arbitrum Sepolia JSON-RPC
 *   POST /rpc/eth   → Ethereum Sepolia JSON-RPC
 */
import { createServer } from "node:http";

const PORT = Number(process.argv[2] ?? 42099);

const ARB = 421614;
const ETH = 11155111;

const OPERATORS = [
  "Add",
  "Sub",
  "Mul",
  "Lt",
  "Gt",
  "Eq",
  "Transfer",
  "Mint",
  "Burn",
  "Select",
  "Allow",
  "AllowPublic",
];

const hex = (n, width = 64) => `0x${BigInt(n).toString(16).padStart(width, "0")}`;
const addr = (n) => `0x${BigInt(n).toString(16).padStart(40, "0")}`;

/** 120 handles, deterministically spread across operators and both chains. */
const HANDLES = Array.from({ length: 120 }, (_, i) => ({
  id: hex(1_000_000 + i),
  operator: OPERATORS[i % OPERATORS.length],
  caller: addr(0xa000 + (i % 7)),
  timestamp: String(1_760_000_000 - i * 60),
  blockNumber: String(289_000_000 - i),
  transactionHash: hex(0xdead_0000 + i),
  isPubliclyDecryptable: i % 5 === 0,
  chainId: i % 3 === 0 ? ETH : ARB,
}));

/** 60 ACL grants, alternating ADMIN / VIEWER. */
const GRANTS = Array.from({ length: 60 }, (_, i) => ({
  id: hex(2_000_000 + i),
  handleId: hex(1_000_000 + i),
  account: addr(0xb000 + (i % 11)),
  role: i % 2 === 0 ? "ADMIN" : "VIEWER",
  grantedBy: addr(0xc000 + (i % 3)),
  timestamp: String(1_760_000_000 - i * 120),
  blockNumber: String(289_000_000 - i),
  transactionHash: hex(0xbeef_0000 + i),
  chainId: i % 4 === 0 ? ETH : ARB,
}));

const TRANSFERS = Array.from({ length: 40 }, (_, i) => ({
  id: hex(3_000_000 + i),
  token: addr(0xd000 + (i % 2)),
  from: i % 6 === 0 ? addr(0) : addr(0xe000 + (i % 5)),
  to: i % 7 === 0 ? addr(0) : addr(0xf000 + (i % 5)),
  kind: i % 6 === 0 ? "MINT" : i % 7 === 0 ? "BURN" : "TRANSFER",
  timestamp: String(1_760_000_000 - i * 300),
  transactionHash: hex(0xcafe_0000 + i),
  logIndex: i,
  chainId: i % 3 === 0 ? ETH : ARB,
}));

/**
 * Finalized unwrap requests, keyed to the four wrapper addresses the dashboard
 * queries. These feed the TVS unshield events + cumulative-unwrap totals now
 * that those come from the indexer rather than an RPC log scan. Token addresses
 * are lowercased to match the `token.toLowerCase()` the client sends.
 */
const UNWRAP_WRAPPERS = [
  { token: "0x1ccec6bc60db15e4055d43dc2531bb7d4e5b808e", chainId: ARB },
  { token: "0x92b23f4a59175415ced5cb37e64a1fc6a9d79af4", chainId: ARB },
  { token: "0xcf220069b8d803047d9fe773e059a1e4981daa68", chainId: ETH },
  { token: "0x12b7025544088f35101245af046cb92e91d17d2c", chainId: ETH },
];

const UNWRAPS = UNWRAP_WRAPPERS.flatMap((w, wi) =>
  Array.from({ length: 6 }, (_, i) => ({
    id: `${w.token}-unwrap-${i}`,
    token: w.token,
    chainId: w.chainId,
    receiver: addr(0xd100 + i),
    unwrapRequestId: hex(0x7000 + wi * 16 + i),
    unwrapAmountHandle: hex(0x8000 + i),
    status: "FINALIZED",
    plaintextAmount: String(BigInt(500 + i) * 10n ** 6n),
    requestedBlock: String(288_000_000 - wi * 1000 - i),
    requestedTimestamp: String(1_759_000_000 - i * 3600),
    requestedTx: hex(0x5100 + wi * 16 + i),
    finalizedBlock: String(288_500_000 - wi * 1000 - i),
    finalizedTimestamp: String(1_759_500_000 - i * 3600),
    finalizedTx: hex(0x6100 + wi * 16 + i),
  })),
);

/**
 * Ponder paginates with `limit`/`after`, where the cursor is an offset. One
 * page is enough for the suite, so `hasNextPage` reports honestly and the
 * scans terminate with complete: true.
 */
function page(items, variables = {}) {
  const limit = Number(variables.limit ?? 100);
  const start = Number(variables.after ?? 0);
  const slice = items.slice(start, start + limit);
  const end = start + slice.length;
  return {
    items: slice,
    pageInfo: { hasNextPage: end < items.length, endCursor: String(end) },
  };
}

function handleGraphql(body) {
  const { query = "", variables = {} } = body;

  if (query.includes("_meta")) {
    return { data: { _meta: { status: { ready: true } } } };
  }
  if (query.includes("aclGrants")) {
    let rows = GRANTS;
    if (variables.address) {
      const a = String(variables.address).toLowerCase();
      rows = GRANTS.filter(
        (g) => g.account.toLowerCase() === a || g.grantedBy.toLowerCase() === a,
      );
    }
    return { data: { aclGrants: page(rows, variables) } };
  }
  if (query.includes("confidentialTransfers")) {
    return { data: { confidentialTransfers: page(TRANSFERS, variables) } };
  }
  if (query.includes("unwrapRequests")) {
    let rows = UNWRAPS;
    if (variables.token) {
      const t = String(variables.token).toLowerCase();
      rows = rows.filter((u) => u.token === t);
    }
    if (variables.chainId !== undefined) {
      rows = rows.filter((u) => u.chainId === Number(variables.chainId));
    }
    return { data: { unwrapRequests: page(rows, variables) } };
  }
  if (query.includes("tokens(")) {
    return {
      data: {
        tokens: {
          items: [
            {
              address: addr(0xd000),
              holderCount: "42",
              transferCount: "128",
              mintCount: "12",
              burnCount: "4",
            },
          ],
        },
      },
    };
  }
  if (query.includes("fheHandles")) {
    let rows = HANDLES;
    if (variables.id) rows = HANDLES.filter((h) => h.id === variables.id);
    if (variables.transactionHash)
      rows = HANDLES.filter((h) => h.transactionHash === variables.transactionHash);
    if (variables.blockNumber)
      rows = HANDLES.filter((h) => h.blockNumber === String(variables.blockNumber));
    if (variables.chainId !== undefined)
      rows = rows.filter((h) => h.chainId === Number(variables.chainId));
    return { data: { fheHandles: page(rows, variables) } };
  }

  return { data: {} };
}

/** keccak256("Transfer(address,address,uint256)") */
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

/** Chain heads. ETH Sepolia is far shorter than Arbitrum, which changes how
 * many chunks the scan walks — worth reproducing rather than flattening. */
const HEADS = { arb: 289_397_226n, eth: 11_309_358n };

/** Deploy-ish block each chain's seeded events sit just above. */
const SEED_FROM = { arb: 251_000_000n, eth: 8_100_000n };

/**
 * Synthesises shield events (ERC-20 Transfer into a wrapper) that match the
 * query.
 *
 * A real node only returns logs matching the requested address and topics, and
 * viem discards any that do not — so the caller's own filter is echoed back.
 * Each log is keyed by chain, wrapper and index so that ids stay unique:
 * returning one fixed set for every token and chunk produced thousands of
 * events sharing a txHash+logIndex, which made pagination look broken.
 */
function logsFor(params, chain) {
  const topics = params.topics ?? [];
  if (topics[0] !== TRANSFER_TOPIC) return [];

  const seed = SEED_FROM[chain];
  const from = BigInt(params.fromBlock ?? "0x0");
  const to = BigInt(params.toBlock ?? HEADS[chain]);
  // Events live in exactly one chunk, so the other chunks exercise the empty path.
  if (seed < from || seed > to) return [];

  const toTopic = topics[2] ?? `0x${"0".repeat(24)}${addr(0x1ccec).slice(2)}`;
  // Distinct per wrapper, so two tokens never emit the same event id.
  const wrapperSeed = BigInt(`0x${toTopic.slice(-8)}`);

  return Array.from({ length: 30 }, (_, i) => ({
    address: params.address ?? addr(0x9923),
    topics: [
      TRANSFER_TOPIC,
      `0x${"0".repeat(24)}${addr(0xa100 + (i % 6)).slice(2)}`,
      toTopic,
    ],
    data: hex(BigInt(1000 + i) * 10n ** 6n),
    blockNumber: hex(seed + BigInt(i), 8),
    blockHash: hex(wrapperSeed + BigInt(i)),
    transactionHash: hex(wrapperSeed * 1000n + BigInt(i)),
    transactionIndex: "0x0",
    logIndex: hex(i, 2),
    removed: false,
  }));
}

function handleRpc(body, chain) {
  const reply = (result) => ({ jsonrpc: "2.0", id: body.id, result });

  switch (body.method) {
    case "eth_chainId":
      return reply(chain === "eth" ? "0xaa36a7" : "0x66eee");
    case "eth_blockNumber":
      return reply(hex(HEADS[chain], 8));
    case "eth_getBlockByNumber":
      return reply({
        number: body.params?.[0] ?? "0x1",
        hash: hex(0x1234),
        timestamp: "0x68e0d000",
        transactions: [],
      });
    case "eth_call":
      // Wide enough for a uint256 and right-aligned for an address, which
      // covers inferredTotalSupply() and underlying().
      return reply(hex(1_000_000n * 10n ** 6n));
    case "eth_getLogs":
      return reply(logsFor(body.params?.[0] ?? {}, chain));
    default:
      return reply(null);
  }
}

createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    let body = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      /* fall through to an empty body */
    }

    const url = req.url ?? "/";
    const respond = (payload) => {
      const json = JSON.stringify(payload);
      res.writeHead(200, {
        "content-type": "application/json",
        "content-length": Buffer.byteLength(json),
      });
      res.end(json);
    };

    if (url.startsWith("/graphql")) return respond(handleGraphql(body));
    if (url.startsWith("/rpc")) {
      // /rpc/eth vs /rpc/arb, so the two chains can differ in head height and
      // therefore in how many chunks the scan walks.
      const chain = url.includes("/eth") ? "eth" : "arb";
      // viem batches JSON-RPC calls into an array.
      if (Array.isArray(body)) return respond(body.map((b) => handleRpc(b, chain)));
      return respond(handleRpc(body, chain));
    }
    res.writeHead(404).end();
  });
}).listen(PORT, () => {
  console.log(`mock backend on http://127.0.0.1:${PORT}`);
});
