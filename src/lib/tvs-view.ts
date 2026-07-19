import type { TvsEventVM } from "@/components/TvsTable";
import type { TvsEvent } from "./tvs";
import {
  formatTokenAmount,
  formatUsd,
  relativeTime,
  shortAddress,
} from "./format";

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
