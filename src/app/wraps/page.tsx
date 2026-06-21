import { TopNav } from "@/components/TopNav";
import { LiveRefresh } from "@/components/LiveRefresh";
import { Sidebar } from "@/components/Sidebar";
import { TvsTable, type TvsEventVM } from "@/components/TvsTable";
import { loadTvsEvents } from "@/lib/tvs";
import { formatTokenAmount, formatUsd, relativeTime, shortAddress } from "@/lib/format";
import { TOKENS } from "@/lib/nox";

export const revalidate = 60;

export default async function WrapsPage() {
  const payload = await loadTvsEvents();

  const events: TvsEventVM[] = payload.events.map((e) => ({
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
  }));

  const byToken = TOKENS.map((t) => {
    const tokenEvents = events.filter((e) => e.symbol === t.underlyingSymbol && e.chainId === t.chainId);
    const shields = tokenEvents.filter((e) => e.direction === "shield");
    const unshields = tokenEvents.filter((e) => e.direction === "unshield");
    return { ...t, shields, unshields, total: tokenEvents.length };
  });

  return (
    <div className="min-h-screen">
      <TopNav showOpenDashboard={false} />
      <LiveRefresh />
      <div className="flex">
        <Sidebar rlcPrice={payload.prices.rlc} activeKey="wraps" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/40 px-6 py-4 backdrop-blur lg:px-10">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted-2)]">Dashboards</div>
              <h1 className="font-display mt-1 text-[22px] font-medium tracking-tight">Shield / Unshield</h1>
            </div>
            <div className="flex items-center gap-3">
              {payload.partial && (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-amber-300">
                  Partial sync
                </span>
              )}
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                <span className="pulse-dot inline-block size-1.5 rounded-full bg-[var(--color-positive)]" />
                Live · ISR 60s
              </span>
            </div>
          </div>

          <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
            {/* Per-token breakdown */}
            <div className="mb-8 grid gap-4 lg:grid-cols-2">
              {byToken.map((t) => (
                <div
                  key={`${t.id}-${t.chainId}`}
                  className="surface-solid rounded-xl p-5"
                  style={{ borderLeft: `2px solid ${t.accent}` }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[16px] font-medium">{t.symbol}</span>
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] ${t.chainId === 421614 ? "border border-blue-500/30 bg-blue-500/10 text-blue-400" : "border border-purple-500/30 bg-purple-500/10 text-purple-400"}`}>
                        {t.chainId === 421614 ? "ARB" : "ETH"}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[var(--color-muted)]">
                      {t.total.toLocaleString()} events
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-positive)]">Shield</div>
                      <div className="mt-1 font-display text-[22px] font-medium">{t.shields.length.toLocaleString()}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-[var(--color-muted)]">
                        {formatUsd(t.shields.reduce((s, e) => s + e.amountUsd, 0))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-negative)]">Unshield</div>
                      <div className="mt-1 font-display text-[22px] font-medium">{t.unshields.length.toLocaleString()}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-[var(--color-muted)]">
                        {formatUsd(t.unshields.reduce((s, e) => s + e.amountUsd, 0))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <TvsTable events={events} />
          </main>
        </div>
      </div>
    </div>
  );
}
