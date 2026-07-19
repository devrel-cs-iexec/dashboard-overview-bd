"use client";

import { useState, useMemo } from "react";
import type { HandleRow } from "@/lib/subgraph";
import { CAT_COLOR, type OpCategory } from "@/lib/nox";
import { relativeTime, shortAddress, explorerTx } from "@/lib/format";
import { ChainBadge } from "./ChainBadge";

export type EventRow = HandleRow & { category: OpCategory | "other" };

const CATEGORIES: (OpCategory | "other" | "all")[] = [
  "all",
  "arithmetic",
  "comparison",
  "token",
  "control",
  "acl",
  "other",
];

const PAGE_SIZE = 25;

export function EventsTable({ rows }: { rows: EventRow[] }) {
  const [cat, setCat] = useState<OpCategory | "other" | "all">("all");
  const [chain, setChain] = useState<"all" | "arb" | "eth">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (cat !== "all" && r.category !== cat) return false;
      if (chain === "arb" && r.chainId !== 421614) return false;
      if (chain === "eth" && r.chainId !== 11155111) return false;
      if (!q) return true;
      return (
        r.operator.toLowerCase().includes(q) ||
        r.transactionHash.toLowerCase().includes(q)
      );
    });
  }, [rows, cat, chain, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="surface-solid overflow-hidden rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 p-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={cat === c}
                onClick={() => {
                  setCat(c);
                  setPage(1);
                }}
                className={`rounded px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                  cat === c
                    ? "bg-[var(--color-accent-dim)] text-[var(--color-accent-soft)]"
                    : "text-[var(--color-muted)] hover:text-white"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 p-1">
            {(["all", "arb", "eth"] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={chain === c}
                onClick={() => {
                  setChain(c);
                  setPage(1);
                }}
                className={`rounded px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                  chain === c
                    ? "bg-[var(--color-accent-dim)] text-[var(--color-accent-soft)]"
                    : "text-[var(--color-muted)] hover:text-white"
                }`}
              >
                {c === "all" ? "All chains" : c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            role="status"
            aria-live="polite"
            className="font-mono text-[11px] text-[var(--color-muted-2)]"
          >
            {filtered.length.toLocaleString()} / {rows.length.toLocaleString()}
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search op or tx…"
            aria-label="Search events by operation or transaction"
            className="w-full sm:w-48 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-3 py-1.5 font-mono text-[12px] text-white placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
              <th scope="col" className="px-5 py-3 font-mono font-normal sm:px-7">
                Operation
              </th>
              <th scope="col" className="px-5 py-3 font-mono font-normal sm:px-7">
                Chain
              </th>
              <th scope="col" className="px-5 py-3 font-mono font-normal sm:px-7">
                Category
              </th>
              <th scope="col" className="px-5 py-3 font-mono font-normal sm:px-7">
                Public
              </th>
              <th scope="col" className="px-5 py-3 font-mono font-normal sm:px-7">
                Time
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
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-7 py-10 text-center text-[var(--color-muted)]"
                >
                  No events match the current filter.
                </td>
              </tr>
            ) : (
              visible.map((r) => (
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
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-[11px] text-[var(--color-muted)] sm:px-7">
                    {relativeTime(Number(r.blockTimestamp))}
                  </td>
                  <td className="px-5 py-3 text-right sm:px-7">
                    <a
                      href={explorerTx(r.chainId, r.transactionHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[12px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)]"
                    >
                      {shortAddress(r.transactionHash)} ↗
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-start gap-3 border-t border-[var(--color-border)] px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <span className="font-mono text-[11px] text-[var(--color-muted-2)]">
          {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
          {Math.min(safePage * PAGE_SIZE, filtered.length)} of{" "}
          {filtered.length.toLocaleString()}
        </span>
        <div className="flex items-center gap-1">
          <PageBtn
            onClick={() => setPage(Math.max(1, safePage - 1))}
            disabled={safePage <= 1}
          >
            ← Prev
          </PageBtn>
          <span className="px-3 font-mono text-[11px] text-[var(--color-muted)]">
            {safePage} / {totalPages}
          </span>
          <PageBtn
            onClick={() => setPage(Math.min(totalPages, safePage + 1))}
            disabled={safePage >= totalPages}
          >
            Next →
          </PageBtn>
        </div>
      </div>
    </div>
  );
}

function PageBtn({
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
