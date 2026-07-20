import { wrapperAbi, erc20TransferEvent, unwrapFinalizedEvent } from "./abi";
import { TOKENS, type ConfidentialToken } from "./nox";
import { publicClient, ethSepoliaClient } from "./viem";
import { getPrices, priceFor, type Prices } from "./price";
import { chunkedGetLogs, clientForChain, bigintToNumber, pool } from "./rpc";
import { ETH_SEPOLIA_ID } from "./nox";
import type { PublicClient } from "viem";

export type TvsEventDirection = "shield" | "unshield";

export type TvsEvent = {
  /** stable identifier: txHash + logIndex */
  id: string;
  direction: TvsEventDirection;
  /** Token symbol the user interacts with (e.g. USDC for shield, RLC etc.) */
  symbol: ConfidentialToken["underlyingSymbol"];
  confidentialSymbol: ConfidentialToken["symbol"];
  chainId: number;
  wrapper: `0x${string}`;
  underlying: `0x${string}`;
  decimals: number;
  accent: string;
  /** user-facing party: depositor for shield, recipient for unshield */
  account: `0x${string}`;
  amount: bigint;
  amountUsd: number;
  blockNumber: bigint;
  /** unix seconds, may be 0 if RPC didn't include it */
  timestamp: number;
  transactionHash: `0x${string}`;
  logIndex: number;
};

export type TvsPayload = {
  events: TvsEvent[];
  /** Whether at least one log query failed (UI can warn) */
  partial: boolean;
  /** Sum of shield/unshield USD across the whole range */
  shieldedUsd: number;
  unshieldedUsd: number;
  prices: Prices;
};

/**
 * Module-level cache for the full historical scan.
 *
 * Per-process, so on a multi-instance deploy each instance keeps its own copy
 * and users may see slightly different `partial` states.
 */
/**
 * Concurrent eth_getBlockByNumber calls while backfilling event timestamps.
 * Kept at the previous peak: the win here is that the pool sustains this depth
 * instead of draining between batches, not that the depth went up. Raising it
 * pushed the build workers into an OOM kill during static generation.
 */
const BLOCK_FETCH_CONCURRENCY = 8;

const TVS_TTL_MS = 60_000;

/** How long a stale payload may still be served while a refresh runs behind it. */
const TVS_MAX_STALE_MS = 10 * 60_000;

type CacheEntry = { ts: number; payload: TvsPayload };
let tvsCache: CacheEntry | null = null;
let tvsFlight: Promise<TvsPayload> | null = null;

/** Runs the scan, coalescing concurrent callers onto one in-flight request. */
function refreshTvs(): Promise<TvsPayload> {
  if (tvsFlight) return tvsFlight;

  const flight = loadTvsEventsRaw()
    .then((payload) => {
      const previous = tvsCache;

      // A partial payload is a lower bound. Caching it over a complete one
      // would freeze under-counted totals in for the whole TTL, so a degraded
      // run is allowed to serve but not to overwrite better data.
      const degrades = payload.partial && previous != null && !previous.payload.partial;
      const useless = payload.partial && payload.events.length === 0;

      if (!degrades && !useless) tvsCache = { ts: Date.now(), payload };
      return tvsCache?.payload ?? payload;
    })
    .finally(() => {
      if (tvsFlight === flight) tvsFlight = null;
    });

  tvsFlight = flight;
  return flight;
}

export async function loadTvsEvents(): Promise<TvsPayload> {
  const now = Date.now();

  if (tvsCache && now - tvsCache.ts < TVS_TTL_MS) return tvsCache.payload;

  // Stale but still usable: answer immediately and refresh behind it. Without
  // this the cache was a plain blocking TTL despite its name — every 60s, one
  // unlucky request paid for the entire multi-token historical scan.
  if (tvsCache && now - tvsCache.ts < TVS_MAX_STALE_MS) {
    void refreshTvs().catch(() => {});
    return tvsCache.payload;
  }

  try {
    return await refreshTvs();
  } catch (err) {
    // Cold cache and a failed scan: nothing to serve.
    if (tvsCache) return tvsCache.payload;
    throw err;
  }
}

/**
 * Pull wrap (ERC-20 Transfer to wrapper) + unwrap (UnwrapFinalized) events for
 * every supported token, decorate with timestamps via batched getBlock calls,
 * and merge into a single newest-first timeline.
 */
async function loadTvsEventsRaw(): Promise<TvsPayload> {
  const prices = await getPrices();

  const perTokenResults = await Promise.allSettled(
    TOKENS.map((t) => loadOneTokenEvents(t, prices)),
  );

  const perToken = perTokenResults.map((r) =>
    r.status === "fulfilled" ? r.value : { events: [] as TvsEvent[], partial: true },
  );

  const events = perToken.flatMap((p) => p.events);
  const partial = perToken.some((p) => p.partial);

  // Fill timestamps per chain — block numbers are chain-specific
  const arbEvents = events.filter((e) => e.chainId !== ETH_SEPOLIA_ID);
  const ethEvents = events.filter((e) => e.chainId === ETH_SEPOLIA_ID);

  const [arbTs, ethTs] = await Promise.all([
    fetchBlockTimestamps(
      [...new Set(arbEvents.map((e) => e.blockNumber))],
      publicClient as unknown as PublicClient,
    ),
    fetchBlockTimestamps(
      [...new Set(ethEvents.map((e) => e.blockNumber))],
      ethSepoliaClient as unknown as PublicClient,
    ),
  ]);

  for (const e of arbEvents) e.timestamp = arbTs.get(e.blockNumber) ?? 0;
  for (const e of ethEvents) e.timestamp = ethTs.get(e.blockNumber) ?? 0;

  events.sort((a, b) => {
    if (a.blockNumber === b.blockNumber) return b.logIndex - a.logIndex;
    return a.blockNumber < b.blockNumber ? 1 : -1;
  });

  let shieldedUsd = 0;
  let unshieldedUsd = 0;
  for (const e of events) {
    if (e.direction === "shield") shieldedUsd += e.amountUsd;
    else unshieldedUsd += e.amountUsd;
  }

  return { events, partial, shieldedUsd, unshieldedUsd, prices };
}

type Bucket = { events: TvsEvent[]; partial: boolean };

async function loadOneTokenEvents(
  token: ConfidentialToken,
  prices: Prices,
): Promise<Bucket> {
  const client = clientForChain(token.chainId);

  const underlying =
    token.underlying ??
    ((await client.readContract({
      address: token.wrapper,
      abi: wrapperAbi,
      functionName: "underlying",
    })) as `0x${string}`);

  // Resolve latest block once, shared by both queries for this token.
  const toBlock = await client.getBlockNumber();

  // Shield events: ERC-20 Transfer to wrapper (plaintext amount in log)
  // Unshield events: UnwrapFinalized on the wrapper (plaintextAmount field in the event)
  // chunkedGetLogs splits large ranges into 10M-block pages to stay within RPC limits.
  const [shieldLogs, unshieldLogs] = await Promise.allSettled([
    chunkedGetLogs(client, {
      address: underlying,
      event: erc20TransferEvent,
      args: { to: token.wrapper },
      fromBlock: token.fromBlock,
      toBlock,
    }),
    chunkedGetLogs(client, {
      address: token.wrapper,
      event: unwrapFinalizedEvent,
      fromBlock: token.fromBlock,
      toBlock,
    }),
  ]);

  const partial = shieldLogs.status === "rejected" || unshieldLogs.status === "rejected";
  const events: TvsEvent[] = [];

  const price = priceFor(token.underlyingSymbol, prices);
  const toUsd = (raw: bigint): number => bigintToNumber(raw, token.decimals) * price;

  if (shieldLogs.status === "fulfilled") {
    for (const log of shieldLogs.value) {
      const args = (log as unknown as { args: Record<string, unknown> }).args;
      const amount = args?.value as bigint | undefined;
      const from = args?.from as `0x${string}` | undefined;
      if (typeof amount !== "bigint" || !from) continue;
      events.push({
        id: `${log.transactionHash}-${log.logIndex}`,
        direction: "shield",
        symbol: token.underlyingSymbol,
        confidentialSymbol: token.symbol,
        chainId: token.chainId,
        wrapper: token.wrapper,
        underlying,
        decimals: token.decimals,
        accent: token.accent,
        account: from,
        amount,
        amountUsd: toUsd(amount),
        blockNumber: log.blockNumber ?? 0n,
        timestamp: 0, // filled later via fetchBlockTimestamps
        transactionHash: log.transactionHash as `0x${string}`,
        logIndex: log.logIndex ?? 0,
      });
    }
  }

  if (unshieldLogs.status === "fulfilled") {
    for (const log of unshieldLogs.value) {
      const args = (log as unknown as { args: Record<string, unknown> }).args;
      const receiver = args?.receiver as `0x${string}` | undefined;
      const plaintextAmount = args?.plaintextAmount as bigint | undefined;
      if (typeof plaintextAmount !== "bigint" || !receiver) continue;
      events.push({
        id: `${log.transactionHash}-${log.logIndex}`,
        direction: "unshield",
        symbol: token.underlyingSymbol,
        confidentialSymbol: token.symbol,
        chainId: token.chainId,
        wrapper: token.wrapper,
        underlying,
        decimals: token.decimals,
        accent: token.accent,
        account: receiver,
        amount: plaintextAmount,
        amountUsd: toUsd(plaintextAmount),
        blockNumber: log.blockNumber ?? 0n,
        timestamp: 0, // filled by fetchBlockTimestamps
        transactionHash: log.transactionHash as `0x${string}`,
        logIndex: log.logIndex ?? 0,
      });
    }
  }

  return { events, partial };
}

/**
 * Fetch timestamps for a set of unique block numbers.
 *
 * One eth_getBlockByNumber per block is the dominant cost of a cold scan, so
 * calls run through a bounded pool rather than sequential batches, which let
 * the slowest call in each batch gate the rest. Failures are tolerated: a
 * missing timestamp renders as "—" rather than failing the whole page.
 */
async function fetchBlockTimestamps(
  blocks: bigint[],
  client: PublicClient,
): Promise<Map<bigint, number>> {
  const out = new Map<bigint, number>();
  if (blocks.length === 0) return out;

  const settled = await pool(blocks, BLOCK_FETCH_CONCURRENCY, (blockNumber) =>
    client.getBlock({ blockNumber, includeTransactions: false }),
  );

  settled.forEach((r, i) => {
    if (r.status === "fulfilled") out.set(blocks[i], Number(r.value.timestamp));
  });

  return out;
}
