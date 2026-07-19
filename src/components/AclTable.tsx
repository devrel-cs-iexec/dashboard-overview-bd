"use client";

import { useState, useMemo } from "react";
import type { HandleRoleRow } from "@/lib/subgraph";
import { relativeTime, shortAddress, explorerAddress } from "@/lib/format";
import { ChainBadge } from "./ChainBadge";

const PAGE_SIZE = 25;

export function AclTable({ rows }: { rows: HandleRoleRow[] }) {
  const [role, setRole] = useState<"all" | "ADMIN" | "VIEWER">("all");
  const [chain, setChain] = useState<"all" | "arb" | "eth">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (role !== "all" && r.role !== role) return false;
      if (chain === "arb" && r.chainId !== 421614) return false;
      if (chain === "eth" && r.chainId !== 11155111) return false;
      if (!q) return true;
      return r.account.toLowerCase().includes(q) || r.grantedBy.toLowerCase().includes(q);
    });
  }, [rows, role, chain, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="surface-solid overflow-hidden rounded-2xl">
      <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Filter by role"
            className="flex flex-wrap items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 p-1"
          >
            {(["all", "ADMIN", "VIEWER"] as const).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={role === r}
                onClick={() => {
                  setRole(r);
                  setPage(1);
                }}
                className={`rounded px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                  role === r
                    ? "bg-[var(--color-accent-dim)] text-[var(--color-accent-soft)]"
                    : "text-[var(--color-muted)] hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div
            role="group"
            aria-label="Filter by chain"
            className="flex flex-wrap items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 p-1"
          >
            {(["all", "arb", "eth"] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={chain === c}
                onClick={() => {
                  setChain(c);
                  setPage(1);
                }}
                className={`rounded px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
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
            placeholder="Search address…"
            aria-label="Search ACL grants by address"
            className="w-full sm:w-48 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-3 py-1.5 font-mono text-[12px] text-white placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
              <th scope="col" className="px-5 py-3 font-mono font-normal sm:px-7">
                Account
              </th>
              <th scope="col" className="px-5 py-3 font-mono font-normal sm:px-7">
                Chain
              </th>
              <th scope="col" className="px-5 py-3 font-mono font-normal sm:px-7">
                Role
              </th>
              <th scope="col" className="px-5 py-3 font-mono font-normal sm:px-7">
                Granted By
              </th>
              <th
                scope="col"
                className="px-5 py-3 text-right font-mono font-normal sm:px-7"
              >
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-7 py-10 text-center text-[var(--color-muted)]"
                >
                  No grants match the current filter.
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--color-border)]/60 transition-colors last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3 font-mono text-[12px] sm:px-7">
                    <a
                      href={explorerAddress(r.chainId, r.account)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--color-foreground)]/85 hover:text-[var(--color-accent)]"
                    >
                      {shortAddress(r.account)}
                    </a>
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
                    <a
                      href={explorerAddress(r.chainId, r.grantedBy)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--color-muted)] hover:text-[var(--color-accent)]"
                    >
                      {shortAddress(r.grantedBy)}
                    </a>
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
