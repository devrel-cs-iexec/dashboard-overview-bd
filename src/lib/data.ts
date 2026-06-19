import { wrapperAbi, erc20Abi, unwrapFinalizedEvent } from "./abi";
import {
  TOKENS,
  opCategory,
  type OpCategory,
  type ConfidentialToken,
} from "./nox";
import { publicClient, ethSepoliaClient } from "./viem";
import { getPrices, priceFor, type Prices } from "./price";
import {
  getMeta,
  scanHandles,
  scanRoles,
  type HandleRow,
} from "./subgraph";
import { getPonderTokenStats } from "./ponder";

export type TokenStats = ConfidentialToken & {
  underlyingResolved: `0x${string}`;
  /** ERC-20 currently held by the wrapper (= current locked = TVL) */
  tvl: bigint;
  /** TVL + sum of all finalized unwrap plaintextAmounts (= cumulative inflows = TVS) */
  tvs: bigint;
  /** Cumulative ERC-20 outflows: sum of finalized unwrap plaintextAmounts */
  cumulativeUnwraps: bigint;
  /** Number of finalized unwrap events indexed by Ponder */
  unwrapCount: number;
  /** Unique wallets that ever interacted with this token (from Ponder) */
  holderCount: number;
  /** Same numbers in USD, using the live CoinGecko price */
  tvlUsd: number;
  tvsUsd: number;
  /** Whether the Ponder scan completed successfully */
  unwrapsScanned: boolean;
};

export type OpsBreakdown = Record<OpCategory | "other", number>;

export type DashboardData = {
  meta: { block: number; timestamp: number; lagSeconds: number };
  prices: Prices;
  tokens: TokenStats[];
  totals: {
    tvlUsd: number;
    tvsUsd: number;
    handles: number;
    handlesLast24h: number;
    handlesLast7d: number;
    transferHandles: number;
    distinctOperators: number;
    aclGrants: number;
    distinctViewers: number;
    distinctAdmins: number;
  };
  ops: OpsBreakdown;
  topOperators: { operator: string; count: number }[];
};

export async function loadDashboard(): Promise<DashboardData> {
  const [meta, prices, allHandlesRaw, roles] = await Promise.all([
    getMeta(),
    getPrices(),
    scanHandles({ pageSize: 1000, maxPages: 12 }),
    scanRoles({ pageSize: 1000, maxPages: 8 }),
  ]);

  // Token stats need the prices, so resolve them after prices arrive
  const tokenStats = await loadTokenStats(prices);

  const normalizeOp = (h: HandleRow): HandleRow => ({
    ...h,
    operator: h.operator?.trim() ? h.operator : "Unknown",
  });
  const allHandles = allHandlesRaw.map(normalizeOp);

  const now = Math.floor(Date.now() / 1000);
  const oneDay = now - 86_400;
  const sevenDays = now - 7 * 86_400;

  let handlesLast24h = 0;
  let handlesLast7d = 0;
  let transferHandles = 0;
  const opCounts = new Map<string, number>();
  for (const h of allHandles) {
    const ts = Number(h.blockTimestamp);
    if (ts >= oneDay) handlesLast24h++;
    if (ts >= sevenDays) handlesLast7d++;
    if (h.operator === "Transfer" || h.operator === "Mint" || h.operator === "Burn")
      transferHandles++;
    opCounts.set(h.operator, (opCounts.get(h.operator) ?? 0) + 1);
  }

  const ops: OpsBreakdown = {
    token: 0,
    arithmetic: 0,
    comparison: 0,
    control: 0,
    acl: 0,
    other: 0,
  };
  for (const [op, count] of opCounts) {
    ops[opCategory(op)] += count;
  }

  const distinctAdmins = new Set<string>();
  const distinctViewers = new Set<string>();
  for (const r of roles) {
    if (r.role === "ADMIN") distinctAdmins.add(r.account.toLowerCase());
    else distinctViewers.add(r.account.toLowerCase());
  }

  const topOperators = [...opCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([operator, count]) => ({ operator, count }));

  const tvlUsd = tokenStats.reduce((acc, t) => acc + t.tvlUsd, 0);
  const tvsUsd = tokenStats.reduce((acc, t) => acc + t.tvsUsd, 0);

  return {
    meta: {
      block: meta.block.number,
      timestamp: meta.block.timestamp,
      lagSeconds: Math.max(0, now - meta.block.timestamp),
    },
    prices,
    tokens: tokenStats,
    totals: {
      tvlUsd,
      tvsUsd,
      handles: allHandles.length,
      handlesLast24h,
      handlesLast7d,
      transferHandles,
      distinctOperators: opCounts.size,
      aclGrants: roles.length,
      distinctAdmins: distinctAdmins.size,
      distinctViewers: distinctViewers.size,
    },
    ops,
    topOperators,
  };
}

async function loadTokenStats(prices: Prices): Promise<TokenStats[]> {
  const results = await Promise.allSettled(TOKENS.map((t) => loadOneTokenStats(t, prices)));
  return results
    .filter((r): r is PromiseFulfilledResult<TokenStats> => r.status === "fulfilled")
    .map((r) => r.value);
}

async function loadOneTokenStats(
  token: ConfidentialToken,
  prices: Prices,
): Promise<TokenStats> {
  const client = token.chainId === 11155111 ? ethSepoliaClient : publicClient;
  const [tvl, underlying, ponderStats, unwrapLogs] = await Promise.all([
    client.readContract({
      address: token.wrapper,
      abi: wrapperAbi,
      functionName: "inferredTotalSupply",
    }) as Promise<bigint>,
    token.underlying
      ? Promise.resolve(token.underlying)
      : (client.readContract({
          address: token.wrapper,
          abi: wrapperAbi,
          functionName: "underlying",
        }) as Promise<`0x${string}`>),
    getPonderTokenStats(token.wrapper),
    client
      .getLogs({
        address: token.wrapper,
        event: unwrapFinalizedEvent,
        fromBlock: token.fromBlock,
        toBlock: "latest",
      })
      .catch(() => [] as never[]),
  ]);

  let cumulativeUnwraps = 0n;
  for (const log of unwrapLogs) {
    const args = (log as unknown as { args: Record<string, unknown> }).args;
    const amt = args?.plaintextAmount as bigint | undefined;
    if (typeof amt === "bigint") cumulativeUnwraps += amt;
  }

  const tvs = tvl + cumulativeUnwraps;
  const price = priceFor(token.underlyingSymbol, prices);
  const divisor = 10n ** BigInt(token.decimals);
  const toUsd = (raw: bigint): number => {
    const whole = Number(raw / divisor);
    const frac = Number(raw % divisor) / Number(divisor);
    return (whole + frac) * price;
  };

  return {
    ...token,
    underlyingResolved: underlying as `0x${string}`,
    tvl,
    tvs,
    cumulativeUnwraps,
    unwrapCount: unwrapLogs.length,
    holderCount: ponderStats ? Number(ponderStats.holderCount) : 0,
    tvlUsd: toUsd(tvl),
    tvsUsd: toUsd(tvs),
    unwrapsScanned: true,
  };
}

export { erc20Abi };
