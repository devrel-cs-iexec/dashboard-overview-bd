import { relativeTime, shortAddress } from "@/lib/format";
import { opCategory } from "@/lib/nox";
import type { DashboardData } from "@/lib/data";
import { Reveal } from "./Reveal";

const CATEGORY_DOT: Record<string, string> = {
  token: "#FFD21F",
  arithmetic: "#A78BFA",
  comparison: "#2775CA",
  control: "#34D399",
  acl: "#F472B6",
  other: "#9CA3AF",
};

export function ActivitySection({ data }: { data: DashboardData }) {
  return (
    <section className="relative py-20 lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
              Live feed
            </div>
            <h2 className="font-display mt-2 text-[36px] font-medium leading-[1.05] tracking-[-0.03em] sm:text-[44px]">
              The last twenty encrypted operations.
            </h2>
          </div>
          <p className="max-w-md text-[14px] leading-[1.55] text-[var(--color-muted)]">
            Each row is a fresh handle minted by Nox Compute. Click through to inspect the
            transaction on Arbiscan — the encrypted value stays private to the holder.
          </p>
        </div>

        <Reveal delay={0.1}>
          <div className="surface mt-10 overflow-hidden rounded-2xl">
            <div className="grid grid-cols-[auto_1fr_auto] gap-4 border-b border-[var(--color-border)] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)] sm:grid-cols-[auto_1.4fr_1fr_auto_auto] sm:px-7">
              <span>Type</span>
              <span>Handle</span>
              <span className="hidden sm:block">Tx</span>
              <span className="hidden sm:block">Visibility</span>
              <span className="text-right">When</span>
            </div>

            <ul className="divide-y divide-[var(--color-border)]">
              {data.recent.map((h) => {
                const cat = opCategory(h.operator);
                const color = CATEGORY_DOT[cat];
                return (
                  <li
                    key={h.id}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02] sm:grid-cols-[auto_1.4fr_1fr_auto_auto] sm:px-7"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-1.5 rounded-full"
                        style={{ background: color }}
                      />
                      <span className="text-[13px] font-medium">{h.operator}</span>
                    </div>
                    <div className="min-w-0 font-mono text-[12px] text-[var(--color-muted)]">
                      <span className="truncate">{shortAddress(h.id)}</span>
                    </div>
                    {h.transactionHash?.startsWith("0x") ? (
                      <a
                        href={`https://sepolia.arbiscan.io/tx/${h.transactionHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hidden font-mono text-[12px] text-white/70 transition-colors hover:text-white sm:inline-flex"
                      >
                        {shortAddress(h.transactionHash)} ↗
                      </a>
                    ) : (
                      <span className="hidden font-mono text-[12px] text-[var(--color-muted-2)] sm:inline-flex">
                        —
                      </span>
                    )}
                    <span className="hidden sm:block">
                      {h.isPubliclyDecryptable ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-accent)]">
                          Encrypted
                        </span>
                      )}
                    </span>
                    <span className="text-right font-mono text-[11px] text-[var(--color-muted)]">
                      {relativeTime(Number(h.blockTimestamp))}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
