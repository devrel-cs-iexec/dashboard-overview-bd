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
 *   POST /graphql  → Ponder queries (fheHandles, aclGrants, confidentialTransfers)
 *   POST /rpc      → JSON-RPC (eth_blockNumber, eth_getBlockByNumber, eth_call, eth_getLogs)
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

function handleRpc(body) {
  const reply = (result) => ({ jsonrpc: "2.0", id: body.id, result });

  switch (body.method) {
    case "eth_chainId":
      return reply("0x66eee");
    case "eth_blockNumber":
      return reply("0x113dcd7f");
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
      // Empty on purpose: the point is to keep the multi-million-block
      // historical scan out of the test server, not to reproduce it.
      return reply([]);
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
      // viem batches JSON-RPC calls into an array.
      if (Array.isArray(body)) return respond(body.map(handleRpc));
      return respond(handleRpc(body));
    }
    res.writeHead(404).end();
  });
}).listen(PORT, () => {
  console.log(`mock backend on http://127.0.0.1:${PORT}`);
});
