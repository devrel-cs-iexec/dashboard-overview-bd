import type { HandleRoleRow } from "@/lib/subgraph";
import { relativeTime, shortAddress } from "@/lib/format";
import { ChainBadge } from "./ChainBadge";
import { ExplorerLink } from "@/components/ExplorerLink";
import type { SearchParams } from "@/lib/table";
import {
  FilterLinks,
  TableSearch,
  TablePagination,
  type FilterOption,
} from "@/components/TableControls";

export const ACL_PAGE_SIZE = 25;

export const ROLE_OPTIONS: FilterOption[] = [
  { value: undefined, label: "All" },
  { value: "ADMIN", label: "Admin" },
  { value: "VIEWER", label: "Viewer" },
];

export const ACL_CHAIN_OPTIONS: FilterOption[] = [
  { value: undefined, label: "All chains" },
  { value: "arb", label: "ARB" },
  { value: "eth", label: "ETH" },
];

/** Server component: renders one page of already-filtered grants. */
export function AclTable({
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
  rows: HandleRoleRow[];
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
            name="role"
            label="Filter by role"
            options={ROLE_OPTIONS}
            active={asString(searchParams.role)}
          />
          <FilterLinks
            pathname={pathname}
            searchParams={searchParams}
            name="chain"
            label="Filter by chain"
            options={ACL_CHAIN_OPTIONS}
            active={asString(searchParams.chain)}
          />
        </div>
        <TableSearch
          pathname={pathname}
          searchParams={searchParams}
          label="Search ACL grants by address"
          placeholder="Search address…"
          filtered={filtered}
          total={total}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <caption className="visually-hidden">
            On-chain access control grants, newest first
          </caption>
          <thead>
            <tr className="border-b border-[var(--color-border)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
              {["Account", "Chain", "Role", "Granted By"].map((h) => (
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
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-7 py-10 text-center text-[var(--color-muted)]"
                >
                  No grants match the current filter.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--color-border)]/60 transition-colors last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3 font-mono text-[12px] sm:px-7">
                    <ExplorerLink
                      chainId={r.chainId}
                      kind="address"
                      value={r.account}
                      label={shortAddress(r.account)}
                      className="focus-ring text-[var(--color-foreground)]/85 hover:text-[var(--color-accent)]"
                    />
                  </td>
                  <td className="px-5 py-3 sm:px-7">
                    <ChainBadge chainId={r.chainId} />
                  </td>
                  <td className="px-5 py-3 sm:px-7">
                    {r.role === "ADMIN" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-300">
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#38bdf8]/30 bg-[#38bdf8]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#38bdf8]">
                        Viewer
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-[12px] sm:px-7">
                    <ExplorerLink
                      chainId={r.chainId}
                      kind="address"
                      value={r.grantedBy}
                      label={shortAddress(r.grantedBy)}
                      className="focus-ring text-[var(--color-muted)] hover:text-[var(--color-accent)]"
                    />
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-[11px] text-[var(--color-muted)] sm:px-7">
                    {relativeTime(Number(r.blockTimestamp))}
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
        noun="grants"
      />
    </div>
  );
}
