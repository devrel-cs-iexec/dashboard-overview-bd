import type { PublicClient, Log } from "viem";
import { publicClient, ethSepoliaClient } from "./viem";
import { ETH_SEPOLIA_ID } from "./nox";

/**
 * Resolves the viem client for a chain id. The casts are needed because
 * createPublicClient with a defineChain produces a narrower type than the
 * generic PublicClient the log helpers accept.
 */
export function clientForChain(chainId: number): PublicClient {
  return chainId === ETH_SEPOLIA_ID
    ? (ethSepoliaClient as unknown as PublicClient)
    : (publicClient as unknown as PublicClient);
}

/**
 * Blocks per eth_getLogs page. Providers reject or time out on very wide
 * ranges, and the deploy-block-to-head span is hundreds of millions of blocks
 * on Arbitrum.
 */
const CHUNK_SIZE = 10_000_000n;

/** How many chunk requests may be in flight at once. */
const CHUNK_CONCURRENCY = 4;

export type LogQuery = {
  address: `0x${string}`;
  event: unknown;
  args?: unknown;
  fromBlock: bigint;
  toBlock: bigint;
};

/**
 * getLogs over an arbitrarily wide block range, split into bounded pages.
 *
 * Pages run with bounded concurrency rather than strictly sequentially: the
 * ranges are independent, and a full-history scan is otherwise dominated by
 * round-trip latency. Results are reassembled in range order so callers still
 * see a chronological log stream.
 *
 * Rejects if any page rejects — a partial log set would silently understate
 * every figure derived from it.
 */
export async function chunkedGetLogs(
  client: PublicClient,
  params: LogQuery,
): Promise<Log[]> {
  const ranges: { from: bigint; to: bigint }[] = [];
  for (let from = params.fromBlock; from <= params.toBlock; from += CHUNK_SIZE) {
    const end = from + CHUNK_SIZE - 1n;
    ranges.push({ from, to: end < params.toBlock ? end : params.toBlock });
  }

  const settled = await pool(ranges, CHUNK_CONCURRENCY, (range) =>
    (client.getLogs as (p: unknown) => Promise<Log[]>)({
      ...params,
      fromBlock: range.from,
      toBlock: range.to,
    }),
  );

  const failure = settled.find((r) => r.status === "rejected");
  if (failure && failure.status === "rejected") throw failure.reason;

  return settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

/**
 * Converts a fixed-point on-chain amount to a JS number.
 *
 * Splits into whole and fractional parts before converting, so amounts beyond
 * Number.MAX_SAFE_INTEGER in raw base units keep their integer precision.
 */
export function bigintToNumber(raw: bigint, decimals: number): number {
  const divisor = 10n ** BigInt(decimals);
  const whole = Number(raw / divisor);
  const frac = Number(raw % divisor) / Number(divisor);
  return whole + frac;
}

/**
 * Maps `fn` over `items` keeping at most `limit` calls in flight, preserving
 * input order in the result.
 *
 * A batched loop (await a slice of N, then the next slice) is not equivalent:
 * there the slowest call in each slice gates the whole slice, so throughput
 * collapses to the slowest-per-batch. This keeps the pipe full.
 */
export async function pool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const out: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;

  const worker = async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      try {
        out[i] = { status: "fulfilled", value: await fn(items[i], i) };
      } catch (reason) {
        out[i] = { status: "rejected", reason };
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
