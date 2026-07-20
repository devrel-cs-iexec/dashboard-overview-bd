import type { TvsEventVM } from "@/components/TvsTable";
import type { FilterOption } from "@/components/TableControls";
import { matchesQuery } from "./table";
import { ETH_SEPOLIA_ID } from "./nox";
import type { TvsEvent } from "./tvs";
import { formatTokenAmount, formatUsd, relativeTime, shortAddress } from "./format";

/**
 * Maps a domain TVS event to the serialisable shape TvsTable renders. Lives
 * here rather than in the pages so `/` and `/wraps` cannot drift apart.
 */
export function toTvsEventVM(e: TvsEvent): TvsEventVM {
  return {
    id: e.id,
    direction: e.direction,
    symbol: e.symbol,
    confidentialSymbol: e.confidentialSymbol,
    chainId: e.chainId,
    accountFull: e.account,
    accountShort: shortAddress(e.account),
    amount: formatTokenAmount(e.amount, e.decimals, 2),
    amountUsd: e.amountUsd,
    amountUsdShort: formatUsd(e.amountUsd),
    blockNumber: Number(e.blockNumber),
    timestamp: e.timestamp,
    relativeTime: e.timestamp ? relativeTime(e.timestamp) : "—",
    txHash: e.transactionHash,
    txHashShort: shortAddress(e.transactionHash),
    accent: e.accent,
  };
}

/**
 * Applies the URL filters to a set of TVS events. Shared by / and /wraps so the
 * two cannot interpret the same query string differently.
 */
export function filterTvsEvents(
  events: TvsEventVM[],
  filters: { token?: string; dir?: string; q?: string },
): TvsEventVM[] {
  const { token, dir, q } = filters;
  return events.filter((e) => {
    if (dir && e.direction !== dir) return false;
    if (token) {
      const [symbol, chainId] = token.split(":");
      if (e.symbol !== symbol) return false;
      if (chainId && e.chainId !== Number.parseInt(chainId, 10)) return false;
    }
    return matchesQuery(q, e.accountFull, e.txHash, e.symbol);
  });
}

/** Token chips derived from whatever is actually present in the data. */
export function tvsTokenOptions(events: TvsEventVM[]): FilterOption[] {
  const seen = new Map<string, { accent: string; chainId: number }>();
  for (const e of events) {
    const key = `${e.symbol}:${e.chainId}`;
    if (!seen.has(key)) seen.set(key, { accent: e.accent, chainId: e.chainId });
  }
  const multiChain = new Set([...seen.values()].map((v) => v.chainId)).size > 1;

  return [
    { value: undefined, label: "All Tokens" },
    ...[...seen.entries()].map(([key, meta]) => ({
      value: key,
      label: `${key.split(":")[0]}${
        multiChain ? (meta.chainId === ETH_SEPOLIA_ID ? " ETH" : " ARB") : ""
      }`,
      accent: meta.accent,
    })),
  ];
}
