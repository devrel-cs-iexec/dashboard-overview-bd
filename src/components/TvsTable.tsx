"use client";

import { useMemo, useState } from "react";
import { explorerAddress, explorerTx } from "@/lib/format";

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

type Filter = "all" | "shield" | "unshield";

type TokenChip = {
  /** "all" or "{symbol}:{chainId}" (e.g. "USDC:421614") */
  key: string;
  label: string;
  /** background of the round glyph */
  accent?: string;
  /** small letter inside the glyph; falls back to symbol[0] */
  glyph?: string;
};

const PAGE_SIZE = 20;

export function TvsTable({ events }: { events: TvsEventVM[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [token, setToken] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const tokenChips: TokenChip[] = useMemo(() => {
    const seen = new Map<string, { accent?: string; chainId: number }>();
    for (const e of events) {
      const key = `${e.symbol}:${e.chainId}`;
      if (!seen.has(key)) seen.set(key, { accent: e.accent, chainId: e.chainId });
    }
    const distinctChains = new Set([...seen.values()].map((v) => v.chainId));
    const multiChain = distinctChains.size > 1;
    return [
      { key: "all", label: "All Tokens" },
      ...[...seen.entries()].map(([key, meta]) => {
        const symbol = key.split(":")[0];
        const chainLabel = meta.chainId === 11155111 ? " ETH" : " ARB";
        return {
          key,
          label: `${symbol}${multiChain ? chainLabel : ""}`,
          accent: meta.accent,
        };
      }),
    ];
  }, [events]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (filter !== "all" && e.direction !== filter) return false;
      if (token !== "all") {
        const [sym, cid] = token.split(":");
        if (e.symbol !== sym) return false;
        if (cid && e.chainId !== parseInt(cid, 10)) return false;
      }
      if (!q) return true;
      return (
        e.accountFull.toLowerCase().includes(q) ||
        e.txHash.toLowerCase().includes(q) ||
        e.symbol.toLowerCase().includes(q)
      );
    });
  }, [events, filter, token, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="surface-solid overflow-hidden rounded-2xl">
      <TokenFilter
        chips={tokenChips}
        selected={token}
        onSelect={(k) => {
          setToken(k);
          setPage(1);
        }}
      />
      <Toolbar
        filter={filter}
        onFilterChange={(f) => {
          setFilter(f);
          setPage(1);
        }}
        query={query}
        onQueryChange={(q) => {
          setQuery(q);
          setPage(1);
        }}
        count={filtered.length}
        total={events.length}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
              <th scope="col" className="px-5 py-3 font-mono font-normal sm:px-7">
                Address
              </th>
              <th scope="col" className="px-5 py-3 font-mono font-normal sm:px-7">
                Type
              </th>
              <th scope="col" className="px-5 py-3 font-mono font-normal sm:px-7">
                When
              </th>
              <th scope="col" className="px-5 py-3 font-mono font-normal sm:px-7">
                Token
              </th>
              <th
                scope="col"
                className="px-5 py-3 text-right font-mono font-normal sm:px-7"
              >
                Amount
              </th>
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
              rows.map((e) => <Row key={e.id} e={e} />)
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={safePage}
        totalPages={totalPages}
        count={filtered.length}
        pageSize={PAGE_SIZE}
        onPrev={() => setPage(Math.max(1, safePage - 1))}
        onNext={() => setPage(Math.min(totalPages, safePage + 1))}
      />
    </div>
  );
}

function Row({ e }: { e: TvsEventVM }) {
  const isEth = e.chainId === 11155111;
  return (
    <tr className="border-b border-[var(--color-border)]/60 transition-colors last:border-0 hover:bg-white/[0.02]">
      <td className="px-5 py-3 font-mono text-[12px] text-[var(--color-foreground)]/85 sm:px-7">
        <a
          href={explorerAddress(e.chainId, e.accountFull)}
          target="_blank"
          rel="noreferrer"
          className="hover:text-[var(--color-accent)]"
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
            className={`inline-flex items-center rounded px-1 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${isEth ? "border border-purple-500/30 bg-purple-500/10 text-purple-400" : "border border-blue-500/30 bg-blue-500/10 text-blue-400"}`}
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
        <a
          href={explorerTx(e.chainId, e.txHash)}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[12px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)]"
        >
          {e.txHashShort} ↗
        </a>
      </td>
    </tr>
  );
}

function TokenFilter({
  chips,
  selected,
  onSelect,
}: {
  chips: TokenChip[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-5 py-4 sm:px-7">
      {chips.map((chip) => {
        const isActive = chip.key === selected;
        return (
          <button
            key={chip.key}
            type="button"
            aria-pressed={selected === chip.key}
            onClick={() => onSelect(chip.key)}
            className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-all ${
              isActive
                ? "border-[var(--color-accent)]/40 bg-[var(--color-accent-dim)] text-[var(--color-accent-soft)]"
                : "border-[var(--color-border)] bg-[var(--color-surface-2)]/60 text-[var(--color-muted)] hover:border-[var(--color-border-strong)] hover:text-white"
            }`}
          >
            <TokenChipGlyph chip={chip} />
            <span className="tracking-tight">{chip.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TokenChipGlyph({ chip }: { chip: TokenChip }) {
  if (chip.key === "all") {
    return (
      <span
        aria-hidden
        className="grid size-5 place-items-center rounded-full border border-[var(--color-border-strong)] text-[8px] font-bold text-[var(--color-foreground)]/80"
      >
        ∗
      </span>
    );
  }
  const symbol = chip.key.split(":")[0];
  return (
    <span
      aria-hidden
      className="grid size-5 place-items-center rounded-full text-[9px] font-bold text-[#0d0d12]"
      style={{ background: chip.accent ?? "var(--color-muted)" }}
    >
      {chip.glyph ?? symbol[0]}
    </span>
  );
}

function DirectionPill({ direction }: { direction: "shield" | "unshield" }) {
  if (direction === "shield") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-positive)]/30 bg-[color:var(--color-positive)]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-positive)]">
        <span className="size-1.5 rounded-full bg-current" />
        Shield
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-negative)]/30 bg-[color:var(--color-negative)]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-negative)]">
      <span className="size-1.5 rounded-full bg-current" />
      Unshield
    </span>
  );
}

function Toolbar({
  filter,
  onFilterChange,
  query,
  onQueryChange,
  count,
  total,
}: {
  filter: Filter;
  onFilterChange: (f: Filter) => void;
  query: string;
  onQueryChange: (q: string) => void;
  count: number;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
      <div className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 p-1 text-[12px]">
        <ToolbarButton active={filter === "all"} onClick={() => onFilterChange("all")}>
          All
        </ToolbarButton>
        <ToolbarButton
          active={filter === "shield"}
          onClick={() => onFilterChange("shield")}
        >
          Shield
        </ToolbarButton>
        <ToolbarButton
          active={filter === "unshield"}
          onClick={() => onFilterChange("unshield")}
        >
          Unshield
        </ToolbarButton>
      </div>
      <div className="flex items-center gap-3">
        <div className="font-mono text-[11px] text-[var(--color-muted-2)]">
          {count.toLocaleString()} / {total.toLocaleString()} events
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search address, tx, token…"
          aria-label="Search shield and unshield events"
          className="w-full sm:w-56 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-3 py-1.5 font-mono text-[12px] text-white placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-accent)]"
        />
      </div>
    </div>
  );
}

function ToolbarButton({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
        active
          ? "bg-[var(--color-accent-dim)] text-[var(--color-accent-soft)]"
          : "text-[var(--color-muted)] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Pagination({
  page,
  totalPages,
  count,
  pageSize,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  count: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const start = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(count, page * pageSize);
  return (
    <div className="flex flex-col items-start gap-3 border-t border-[var(--color-border)] px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-7">
      <div className="font-mono text-[11px] text-[var(--color-muted-2)]">
        Showing {start.toLocaleString()} to {end.toLocaleString()} of{" "}
        {count.toLocaleString()} events
      </div>
      <div className="flex items-center gap-1">
        <PageButton onClick={onPrev} disabled={page <= 1}>
          ← Previous
        </PageButton>
        <span className="px-3 font-mono text-[11px] text-[var(--color-muted)]">
          Page {page} of {totalPages}
        </span>
        <PageButton onClick={onNext} disabled={page >= totalPages}>
          Next →
        </PageButton>
      </div>
    </div>
  );
}

function PageButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-2.5 py-1 font-mono text-[11px] text-[var(--color-muted)] transition-colors enabled:hover:border-[var(--color-border-strong)] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
