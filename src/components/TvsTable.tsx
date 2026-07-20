import { explorerAddress } from "@/lib/format";
import { ExplorerLink } from "@/components/ExplorerLink";
import { ETH_SEPOLIA_ID } from "@/lib/nox";
import type { SearchParams } from "@/lib/table";
import {
  FilterLinks,
  TableSearch,
  TablePagination,
  type FilterOption,
} from "@/components/TableControls";

export type TvsEventVM = {
  id: string;
  direction: "shield" | "unshield";
  symbol: string;
  confidentialSymbol: string;
  chainId: number;
  accountFull: string;
  accountShort: string;
  amount: string;
  amountUsd: number;
  amountUsdShort: string;
  blockNumber: number;
  timestamp: number;
  relativeTime: string;
  txHash: string;
  txHashShort: string;
  accent: string;
};

export const TVS_PAGE_SIZE = 20;

const DIRECTION_OPTIONS: FilterOption[] = [
  { value: undefined, label: "All" },
  { value: "shield", label: "Shield" },
  { value: "unshield", label: "Unshield" },
];

const asString = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Server component: renders one page of already-filtered events.
 *
 * Filtering and pagination live in the URL and are applied server-side. The
 * client version this replaced received every event as props and filtered in
 * useState, which serialised the whole history into the payload on each
 * request (~315KB) and reset the filters on reload.
 */
export function TvsTable({
  pathname,
  searchParams,
  rows,
  tokenOptions,
  page,
  totalPages,
  filtered,
  total,
  from,
  to,
}: {
  pathname: string;
  searchParams: SearchParams;
  rows: TvsEventVM[];
  tokenOptions: FilterOption[];
  page: number;
  totalPages: number;
  filtered: number;
  total: number;
  from: number;
  to: number;
}) {
  return (
    <div className="surface-solid overflow-hidden rounded-2xl">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-5 py-4 sm:px-7">
        <FilterLinks
          pathname={pathname}
          searchParams={searchParams}
          name="token"
          label="Filter by token"
          options={tokenOptions}
          active={asString(searchParams.token)}
        />
      </div>

      <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <FilterLinks
          pathname={pathname}
          searchParams={searchParams}
          name="dir"
          label="Filter by direction"
          options={DIRECTION_OPTIONS}
          active={asString(searchParams.dir)}
        />
        <TableSearch
          pathname={pathname}
          searchParams={searchParams}
          label="Search events by address, transaction or token"
          placeholder="Search address, tx, token…"
          filtered={filtered}
          total={total}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left">
          <caption className="visually-hidden">
            Shield and unshield events, newest first
          </caption>
          <thead>
            <tr className="border-b border-[var(--color-border)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
              {["Address", "Type", "When", "Token"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-5 py-3 font-mono font-normal sm:px-7"
                >
                  {h}
                </th>
              ))}
              {["Amount", "Tx"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-5 py-3 text-right font-mono font-normal sm:px-7"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-7 py-10 text-center text-[var(--color-muted)]"
                >
                  No events match the current filter.
                </td>
              </tr>
            ) : (
              rows.map((e) => <Row key={e.id} e={e} />)
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        pathname={pathname}
        searchParams={searchParams}
        page={page}
        totalPages={totalPages}
        from={from}
        to={to}
        filtered={filtered}
        noun="events"
      />
    </div>
  );
}

function Row({ e }: { e: TvsEventVM }) {
  const isEth = e.chainId === ETH_SEPOLIA_ID;
  return (
    <tr className="border-b border-[var(--color-border)]/60 transition-colors last:border-0 hover:bg-white/[0.02]">
      <td className="px-5 py-3 font-mono text-[12px] text-[var(--color-foreground)]/85 sm:px-7">
        <a
          href={explorerAddress(e.chainId, e.accountFull)}
          target="_blank"
          rel="noreferrer"
          aria-label={`View address ${e.accountFull} on ${isEth ? "Etherscan" : "Arbiscan"} (opens in a new tab)`}
          className="focus-ring hover:text-[var(--color-accent)]"
        >
          {e.accountShort}
        </a>
      </td>
      <td className="px-5 py-3 sm:px-7">
        <DirectionPill direction={e.direction} />
      </td>
      <td className="px-5 py-3 font-mono text-[11px] text-[var(--color-muted)] sm:px-7">
        <span className="text-white/85">{e.relativeTime}</span>
        <span className="ml-2 text-[var(--color-muted-2)]">
          · block {e.blockNumber.toLocaleString()}
        </span>
      </td>
      <td className="px-5 py-3 sm:px-7">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="grid size-5 place-items-center rounded-full text-[9px] font-bold text-[#0d0d12]"
            style={{ background: e.accent }}
          >
            {e.confidentialSymbol.replace(/^c/, "")[0]}
          </span>
          <span className="text-[12px] text-[var(--color-foreground)]/85">
            {e.symbol}
          </span>
          <span
            className={`inline-flex items-center rounded px-1 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${
              isEth
                ? "border border-purple-500/30 bg-purple-500/10 text-purple-400"
                : "border border-blue-500/30 bg-blue-500/10 text-blue-400"
            }`}
          >
            {isEth ? "ETH" : "ARB"}
          </span>
        </div>
      </td>
      <td className="px-5 py-3 text-right sm:px-7">
        <div className="display-num font-mono text-[13px] text-[var(--color-foreground)]">
          {e.amount} <span className="text-[var(--color-muted)]">{e.symbol}</span>
        </div>
        <div className="font-mono text-[11px] text-[var(--color-muted-2)]">
          {e.amountUsdShort}
        </div>
      </td>
      <td className="px-5 py-3 text-right sm:px-7">
        <ExplorerLink
          chainId={e.chainId}
          kind="tx"
          value={e.txHash}
          label={e.txHashShort}
          className="focus-ring font-mono text-[12px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)]"
        />
      </td>
    </tr>
  );
}

function DirectionPill({ direction }: { direction: "shield" | "unshield" }) {
  const shield = direction === "shield";
  const tone = shield ? "var(--color-positive)" : "var(--color-negative)";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]"
      style={{
        color: tone,
        borderColor: `color-mix(in srgb, ${tone} 30%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${tone} 10%, transparent)`,
      }}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {shield ? "Shield" : "Unshield"}
    </span>
  );
}
