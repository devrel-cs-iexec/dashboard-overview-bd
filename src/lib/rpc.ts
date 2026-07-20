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

  const pages: Log[][] = new Array(ranges.length);
  let next = 0;

  const worker = async () => {
    while (true) {
      const i = next++;
      if (i >= ranges.length) return;
      pages[i] = await (client.getLogs as (p: unknown) => Promise<Log[]>)({
        ...params,
        fromBlock: ranges[i].from,
        toBlock: ranges[i].to,
      });
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(CHUNK_CONCURRENCY, ranges.length) }, worker),
  );

  return pages.flat();
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
