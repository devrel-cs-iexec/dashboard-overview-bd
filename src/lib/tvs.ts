import { wrapperAbi, erc20TransferEvent, unwrapFinalizedEvent } from "./abi";
import { TOKENS, type ConfidentialToken } from "./nox";
import { publicClient, ethSepoliaClient } from "./viem";
import { getPrices, priceFor, type Prices } from "./price";
import { chunkedGetLogs, clientForChain, bigintToNumber } from "./rpc";
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

// Module-level stale-while-revalidate cache — survives concurrent requests,
// prevents RPC hammering, and serves last-known-good data on transient failures.
const TVS_TTL_MS = 60_000;
let tvsCache: { ts: number; payload: TvsPayload } | null = null;
let tvsFlight: Promise<TvsPayload> | null = null;

export async function loadTvsEvents(): Promise<TvsPayload> {
  // Serve cache if still fresh.
  if (tvsCache && Date.now() - tvsCache.ts < TVS_TTL_MS) return tvsCache.payload;

  // Coalesce concurrent requests into one in-flight fetch.
  if (tvsFlight) return tvsFlight;

  tvsFlight = loadTvsEventsRaw()
    .then((payload) => {
      tvsFlight = null;
      // Only promote to cache if we got real data.
      if (!payload.partial || payload.events.length > 0) {
        tvsCache = { ts: Date.now(), payload };
      }
      // Fall back to stale cache on total failure rather than showing 0 events.
      return payload.partial && payload.events.length === 0 && tvsCache
        ? tvsCache.payload
        : payload;
    })
    .catch((err) => {
      tvsFlight = null;
      if (tvsCache) return tvsCache.payload;
      throw err;
    });

  return tvsFlight;
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
 * Batch-fetch block timestamps for a unique set of block numbers. RPCs throttle
 * if we hammer them in parallel — we do small concurrent windows.
 */
async function fetchBlockTimestamps(
  blocks: bigint[],
  client: PublicClient,
): Promise<Map<bigint, number>> {
  const out = new Map<bigint, number>();
  const window = 8;
  for (let i = 0; i < blocks.length; i += window) {
    const slice = blocks.slice(i, i + window);
    const results = await Promise.allSettled(
      slice.map((b) => client.getBlock({ blockNumber: b, includeTransactions: false })),
    );
    results.forEach((r, idx) => {
      if (r.status === "fulfilled") {
        out.set(slice[idx], Number(r.value.timestamp));
      }
    });
  }
  return out;
}
