import { wrapperAbi, erc20Abi } from "./abi";
import { TOKENS, opCategory, type OpCategory, type ConfidentialToken } from "./nox";
import { publicClient } from "./viem";
import {
  getMeta,
  getRecentHandles,
  scanHandles,
  scanRoles,
  type HandleRow,
} from "./subgraph";

export type TokenStats = ConfidentialToken & {
  underlyingResolved: `0x${string}`;
  underlyingSymbol: ConfidentialToken["underlyingSymbol"];
  inferredTotalSupply: bigint;
  confidentialTotalSupplyName: string;
  underlyingName: string;
};

export type OpsBreakdown = Record<OpCategory | "other", number>;

export type DashboardData = {
  meta: { block: number; timestamp: number; lagSeconds: number };
  tokens: TokenStats[];
  totals: {
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
  recent: HandleRow[];
};

export async function loadDashboard(): Promise<DashboardData> {
  const [meta, tokenStats, recentRaw, allHandlesRaw, roles] = await Promise.all([
    getMeta(),
    loadTokenStats(),
    getRecentHandles(24),
    scanHandles({ pageSize: 1000, maxPages: 12 }),
    scanRoles({ pageSize: 1000, maxPages: 8 }),
  ]);

  const normalizeOp = (h: HandleRow): HandleRow => ({
    ...h,
    operator: h.operator?.trim() ? h.operator : "Unknown",
  });
  const recent = recentRaw.map(normalizeOp);
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

  return {
    meta: {
      block: meta.block.number,
      timestamp: meta.block.timestamp,
      lagSeconds: Math.max(0, now - meta.block.timestamp),
    },
    tokens: tokenStats,
    totals: {
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
    recent,
  };
}

async function loadTokenStats(): Promise<TokenStats[]> {
  return Promise.all(TOKENS.map(loadOneTokenStats));
}

async function loadOneTokenStats(token: ConfidentialToken): Promise<TokenStats> {
  const [supply, underlying, confName] = await Promise.all([
    publicClient.readContract({
      address: token.wrapper,
      abi: wrapperAbi,
      functionName: "inferredTotalSupply",
    }),
    token.underlying
      ? Promise.resolve(token.underlying)
      : publicClient.readContract({
          address: token.wrapper,
          abi: wrapperAbi,
          functionName: "underlying",
        }),
    publicClient
      .readContract({
        address: token.wrapper,
        abi: wrapperAbi,
        functionName: "name",
      })
      .catch(() => token.symbol),
  ]);

  const underlyingName = await publicClient
    .readContract({
      address: underlying as `0x${string}`,
      abi: erc20Abi,
      functionName: "name",
    })
    .catch(() => token.underlyingSymbol);

  return {
    ...token,
    underlyingResolved: underlying as `0x${string}`,
    inferredTotalSupply: supply as bigint,
    confidentialTotalSupplyName: confName as string,
    underlyingName: underlyingName as string,
  };
}
