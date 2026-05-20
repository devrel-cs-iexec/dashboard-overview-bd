import { wrapperAbi, unwrapFinalizedEvent, erc20TransferEvent } from "./abi";
import { TOKENS, NOX_COMPUTE_DEPLOY_BLOCK, type ConfidentialToken } from "./nox";
import { publicClient } from "./viem";
import { getPrices, priceFor, type Prices } from "./price";

export type TvsEventDirection = "shield" | "unshield";

export type TvsEvent = {
  /** stable identifier: txHash + logIndex */
  id: string;
  direction: TvsEventDirection;
  /** Token symbol the user interacts with (e.g. USDC for shield, RLC etc.) */
  symbol: ConfidentialToken["underlyingSymbol"];
  confidentialSymbol: ConfidentialToken["symbol"];
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
 * Pull wrap (ERC-20 Transfer to wrapper) + unwrap (UnwrapFinalized) events for
 * every supported token, decorate with timestamps via batched getBlock calls,
 * and merge into a single newest-first timeline.
 */
export async function loadTvsEvents(): Promise<TvsPayload> {
  const prices = await getPrices();

  const perToken = await Promise.all(
    TOKENS.map((t) => loadOneTokenEvents(t, prices)),
  );

  const events = perToken.flatMap((p) => p.events);
  const partial = perToken.some((p) => p.partial);

  // Decorate with block timestamps in a single batched pass
  const blocks = [...new Set(events.map((e) => e.blockNumber))];
  const blockTs = await fetchBlockTimestamps(blocks);
  for (const e of events) {
    e.timestamp = blockTs.get(e.blockNumber) ?? 0;
  }

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
  // Resolve underlying address if not pinned in config (cUSDC case)
  const underlying =
    token.underlying ??
    ((await publicClient.readContract({
      address: token.wrapper,
      abi: wrapperAbi,
      functionName: "underlying",
    })) as `0x${string}`);

  const [shieldLogs, unshieldLogs] = await Promise.allSettled([
    publicClient.getLogs({
      address: underlying,
      event: erc20TransferEvent,
      args: { to: token.wrapper },
      fromBlock: NOX_COMPUTE_DEPLOY_BLOCK,
      toBlock: "latest",
    }),
    publicClient.getLogs({
      address: token.wrapper,
      event: unwrapFinalizedEvent,
      fromBlock: NOX_COMPUTE_DEPLOY_BLOCK,
      toBlock: "latest",
    }),
  ]);

  const partial =
    shieldLogs.status === "rejected" || unshieldLogs.status === "rejected";
  const events: TvsEvent[] = [];

  const price = priceFor(token.underlyingSymbol, prices);
  const toUsd = (raw: bigint): number => {
    const divisor = 10n ** BigInt(token.decimals);
    const whole = Number(raw / divisor);
    const frac = Number(raw % divisor) / Number(divisor);
    return (whole + frac) * price;
  };

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
        wrapper: token.wrapper,
        underlying,
        decimals: token.decimals,
        accent: token.accent,
        account: from,
        amount,
        amountUsd: toUsd(amount),
        blockNumber: log.blockNumber ?? 0n,
        timestamp: 0,
        transactionHash: log.transactionHash as `0x${string}`,
        logIndex: log.logIndex ?? 0,
      });
    }
  }

  if (unshieldLogs.status === "fulfilled") {
    for (const log of unshieldLogs.value) {
      const args = (log as unknown as { args: Record<string, unknown> }).args;
      const amount = args?.plaintextAmount as bigint | undefined;
      const receiver = args?.receiver as `0x${string}` | undefined;
      if (typeof amount !== "bigint" || !receiver) continue;
      events.push({
        id: `${log.transactionHash}-${log.logIndex}`,
        direction: "unshield",
        symbol: token.underlyingSymbol,
        confidentialSymbol: token.symbol,
        wrapper: token.wrapper,
        underlying,
        decimals: token.decimals,
        accent: token.accent,
        account: receiver,
        amount,
        amountUsd: toUsd(amount),
        blockNumber: log.blockNumber ?? 0n,
        timestamp: 0,
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
): Promise<Map<bigint, number>> {
  const out = new Map<bigint, number>();
  const window = 8;
  for (let i = 0; i < blocks.length; i += window) {
    const slice = blocks.slice(i, i + window);
    const results = await Promise.allSettled(
      slice.map((b) =>
        publicClient.getBlock({ blockNumber: b, includeTransactions: false }),
      ),
    );
    results.forEach((r, idx) => {
      if (r.status === "fulfilled") {
        out.set(slice[idx], Number(r.value.timestamp));
      }
    });
  }
  return out;
}
