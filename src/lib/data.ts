import { wrapperAbi, erc20Abi, unwrapFinalizedEvent } from "./abi";
import {
  TOKENS,
  opCategory,
  NOX_COMPUTE_DEPLOY_BLOCK,
  type OpCategory,
  type ConfidentialToken,
} from "./nox";
import { publicClient } from "./viem";
import { getPrices, priceFor, type Prices } from "./price";
import {
  getMeta,
  scanHandles,
  scanRoles,
  type HandleRow,
} from "./subgraph";

export type TokenStats = ConfidentialToken & {
  underlyingResolved: `0x${string}`;
  /** ERC-20 currently held by the wrapper (= current locked = TVL) */
  tvl: bigint;
  /** TVL + sum of all UnwrapFinalized plaintextAmount values (= cumulative inflows = TVS) */
  tvs: bigint;
  /** Cumulative ERC-20 outflows: sum of UnwrapFinalized.plaintextAmount */
  cumulativeUnwraps: bigint;
  /** Number of UnwrapFinalized events seen on-chain */
  unwrapCount: number;
  /** Same numbers in USD, using the live CoinGecko price */
  tvlUsd: number;
  tvsUsd: number;
  /** Whether the UnwrapFinalized scan completed successfully */
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
  return Promise.all(TOKENS.map((t) => loadOneTokenStats(t, prices)));
}

async function loadOneTokenStats(
  token: ConfidentialToken,
  prices: Prices,
): Promise<TokenStats> {
  const [tvl, underlying, unwraps] = await Promise.all([
    publicClient.readContract({
      address: token.wrapper,
      abi: wrapperAbi,
      functionName: "inferredTotalSupply",
    }) as Promise<bigint>,
    token.underlying
      ? Promise.resolve(token.underlying)
      : (publicClient.readContract({
          address: token.wrapper,
          abi: wrapperAbi,
          functionName: "underlying",
        }) as Promise<`0x${string}`>),
    scanUnwrapFinalized(token.wrapper),
  ]);

  const tvs = tvl + unwraps.totalAmount;
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
    cumulativeUnwraps: unwraps.totalAmount,
    unwrapCount: unwraps.count,
    tvlUsd: toUsd(tvl),
    tvsUsd: toUsd(tvs),
    unwrapsScanned: unwraps.scanned,
  };
}

/**
 * Scan all UnwrapFinalized events for a wrapper from the NoxCompute deploy
 * block to now. Filtered by contract address so a single getLogs call is
 * generally accepted even on the public Arbitrum Sepolia RPC. Returns a safe
 * { count: 0, total: 0n, scanned: false } on failure so the page still renders.
 */
async function scanUnwrapFinalized(
  wrapper: `0x${string}`,
): Promise<{ count: number; totalAmount: bigint; scanned: boolean }> {
  try {
    const logs = await publicClient.getLogs({
      address: wrapper,
      event: unwrapFinalizedEvent,
      fromBlock: NOX_COMPUTE_DEPLOY_BLOCK,
      toBlock: "latest",
    });
    let totalAmount = 0n;
    for (const log of logs) {
      const amount = (log as unknown as { args: { plaintextAmount?: bigint } }).args
        ?.plaintextAmount;
      if (typeof amount === "bigint") totalAmount += amount;
    }
    return { count: logs.length, totalAmount, scanned: true };
  } catch {
    return { count: 0, totalAmount: 0n, scanned: false };
  }
}

// Kept for back-compat with anything importing the previous symbol — no-op otherwise.
export { erc20Abi };
