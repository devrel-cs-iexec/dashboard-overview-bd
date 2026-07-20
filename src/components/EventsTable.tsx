import type { HandleRow } from "@/lib/subgraph";
import { CAT_COLOR, type OpCategory } from "@/lib/nox";
import { relativeTime } from "@/lib/format";
import { ChainBadge } from "./ChainBadge";
import { ExplorerLink } from "@/components/ExplorerLink";
import type { SearchParams } from "@/lib/table";
import {
  FilterLinks,
  TableSearch,
  TablePagination,
  type FilterOption,
} from "@/components/TableControls";

export type EventRow = HandleRow & { category: OpCategory | "other" };

export const EVENTS_PAGE_SIZE = 25;

export const CATEGORY_OPTIONS: FilterOption[] = [
  { value: undefined, label: "All" },
  { value: "arithmetic", label: "Arithmetic", accent: CAT_COLOR.arithmetic },
  { value: "comparison", label: "Comparison", accent: CAT_COLOR.comparison },
  { value: "token", label: "Token", accent: CAT_COLOR.token },
  { value: "control", label: "Control", accent: CAT_COLOR.control },
  { value: "acl", label: "ACL", accent: CAT_COLOR.acl },
  { value: "other", label: "Other", accent: CAT_COLOR.other },
];

export const CHAIN_OPTIONS: FilterOption[] = [
  { value: undefined, label: "All chains" },
  { value: "arb", label: "ARB" },
  { value: "eth", label: "ETH" },
];

/** Server component: renders one page of already-filtered rows. */
export function EventsTable({
  pathname,
  searchParams,
  rows,
  page,
  totalPages,
  filtered,
  total,
  from,
  to,
}: {
  pathname: string;
  searchParams: SearchParams;
  rows: EventRow[];
  page: number;
  totalPages: number;
  filtered: number;
  total: number;
  from: number;
  to: number;
}) {
  const asString = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  return (
    <div className="surface-solid overflow-hidden rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex flex-wrap items-center gap-2">
          <FilterLinks
            pathname={pathname}
            searchParams={searchParams}
            name="cat"
            label="Filter by category"
            options={CATEGORY_OPTIONS}
            active={asString(searchParams.cat)}
          />
          <FilterLinks
            pathname={pathname}
            searchParams={searchParams}
            name="chain"
            label="Filter by chain"
            options={CHAIN_OPTIONS}
            active={asString(searchParams.chain)}
          />
        </div>
        <TableSearch
          pathname={pathname}
          searchParams={searchParams}
          label="Search events by operation or transaction"
          placeholder="Search op or tx…"
          filtered={filtered}
          total={total}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left">
          <caption className="visually-hidden">
            Compute operations recorded on-chain
          </caption>
          <thead>
            <tr className="border-b border-[var(--color-border)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
              {["Operation", "Chain", "Category", "Public", "Time"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-5 py-3 font-mono font-normal sm:px-7"
                >
                  {h}
                </th>
              ))}
              <th
                scope="col"
                className="px-5 py-3 text-right font-mono font-normal sm:px-7"
              >
                Tx
              </th>
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
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--color-border)]/60 transition-colors last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3 font-mono text-[12px] font-medium text-white sm:px-7">
                    {r.operator}
                  </td>
                  <td className="px-5 py-3 sm:px-7">
                    <ChainBadge chainId={r.chainId} />
                  </td>
                  <td className="px-5 py-3 sm:px-7">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]"
                      style={{
                        color: CAT_COLOR[r.category],
                        borderColor: `${CAT_COLOR[r.category]}40`,
                        backgroundColor: `${CAT_COLOR[r.category]}12`,
                      }}
                    >
                      {r.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 sm:px-7">
                    {r.isPubliclyDecryptable ? (
                      <span className="font-mono text-[11px] text-[var(--color-positive)]">
                        Yes
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] text-[var(--color-muted-2)]">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-[11px] text-[var(--color-muted)] sm:px-7">
                    {relativeTime(Number(r.blockTimestamp))}
                  </td>
                  <td className="px-5 py-3 text-right sm:px-7">
                    <ExplorerLink
                      chainId={r.chainId}
                      kind="tx"
                      value={r.transactionHash}
                      className="focus-ring font-mono text-[12px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)]"
                    />
                  </td>
                </tr>
              ))
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
