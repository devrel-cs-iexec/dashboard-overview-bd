import { TopNav } from "@/components/TopNav";
import { LiveRefresh } from "@/components/LiveRefresh";
import { Sidebar } from "@/components/Sidebar";
import { loadDashboard } from "@/lib/data";
import { formatUsd } from "@/lib/format";
import { ChainBadge } from "@/components/ChainBadge";

export const revalidate = 60;

const CAT_LABEL: Record<string, string> = {
  arithmetic: "Arithmetic",
  comparison: "Comparison",
  token: "Token ops",
  control: "Control flow",
  acl: "ACL",
  other: "Other",
};
const CAT_COLOR: Record<string, string> = {
  arithmetic: "var(--color-accent)",
  comparison: "#a78bfa",
  token: "var(--color-positive)",
  control: "#fb923c",
  acl: "#38bdf8",
  other: "var(--color-muted)",
};

export default async function OpsPage() {
  const data = await loadDashboard();
  const { totals, ops, topOperators, tokens } = data;

  const totalOps = Object.values(ops).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen">
      <TopNav showOpenDashboard={false} />
      <LiveRefresh />
      <div className="flex">
        <Sidebar rlcPrice={data.prices.rlc} activeKey="ops" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/40 px-6 py-4 backdrop-blur lg:px-10">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted-2)]">Compute</div>
              <h1 className="font-display mt-1 text-[22px] font-medium tracking-tight">Operation Stats</h1>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
              <span className="pulse-dot inline-block size-1.5 rounded-full bg-[var(--color-positive)]" />
              Live · ISR 60s
            </span>
          </div>

          <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
            {/* Stat tiles */}
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] lg:grid-cols-4">
              {[
                { label: "Total handles", value: totals.handles.toLocaleString(), sub: "all-time" },
                { label: "Last 24h", value: totals.handlesLast24h.toLocaleString(), sub: "new handles" },
                { label: "Last 7d", value: totals.handlesLast7d.toLocaleString(), sub: "new handles" },
                { label: "Distinct operators", value: totals.distinctOperators.toLocaleString(), sub: "unique op types" },
              ].map((t) => (
                <div key={t.label} className="bg-[var(--color-surface)] p-5 lg:p-6">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">{t.label}</div>
                  <div className="display-num font-display mt-3 text-3xl font-medium leading-none text-[var(--color-accent)] lg:text-4xl">{t.value}</div>
                  <div className="mt-2 font-mono text-[11px] text-[var(--color-muted)]">{t.sub}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Ops breakdown */}
              <div className="surface-solid rounded-2xl p-6">
                <h2 className="font-display mb-5 text-[17px] font-medium">Operation breakdown</h2>
                <div className="space-y-3">
                  {Object.entries(ops).map(([cat, count]) => {
                    const pct = totalOps > 0 ? (count / totalOps) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div className="mb-1 flex items-center justify-between text-[12px]">
                          <span className="text-[var(--color-foreground)]/85">{CAT_LABEL[cat] ?? cat}</span>
                          <span className="font-mono text-[var(--color-muted)]">
                            {count.toLocaleString()} <span className="text-[var(--color-muted-2)]">({pct.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: CAT_COLOR[cat] ?? "var(--color-muted)" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top operators */}
              <div className="surface-solid rounded-2xl p-6">
                <h2 className="font-display mb-5 text-[17px] font-medium">Top operations</h2>
                <div className="space-y-2">
                  {topOperators.map((op, i) => {
                    const pct = totalOps > 0 ? (op.count / totalOps) * 100 : 0;
                    return (
                      <div key={op.operator} className="flex items-center gap-3">
                        <span className="w-5 shrink-0 font-mono text-[11px] text-[var(--color-muted-2)]">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="font-mono text-[var(--color-foreground)]/85">{op.operator}</span>
                            <span className="font-mono text-[var(--color-muted)]">{op.count.toLocaleString()}</span>
                          </div>
                          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-[var(--color-accent)]/60"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Token stats */}
            <div className="mt-8">
              <h2 className="font-display mb-4 text-[17px] font-medium">Token metrics</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {tokens.map((t) => (
                  <div
                    key={`${t.id}-${t.chainId}`}
                    className="surface-solid rounded-xl p-5"
                    style={{ borderLeft: `2px solid ${t.accent}` }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-[16px] font-medium">{t.symbol}</span>
                        <ChainBadge chainId={t.chainId} />
                      </div>
                      <span className="font-mono text-[11px] text-[var(--color-muted)]">{t.holderCount > 0 ? `${t.holderCount} holders` : ""}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "TVL", value: formatUsd(t.tvlUsd) },
                        { label: "TVS", value: formatUsd(t.tvsUsd) },
                        { label: "Unwrap events", value: t.unwrapCount.toLocaleString() },
                        { label: "Scan status", value: t.unwrapsScanned ? "OK" : "Ponder down" },
                      ].map((m) => (
                        <div key={m.label}>
                          <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted-2)]">{m.label}</div>
                          <div className="mt-1 font-mono text-[13px] text-[var(--color-foreground)]/90">{m.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
