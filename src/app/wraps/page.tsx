import { TvsTable, type TvsEventVM } from "@/components/TvsTable";
import { PageHeader, LivePill, WarnPill } from "@/components/PageHeader";
import { ChainBadge } from "@/components/ChainBadge";
import { loadTvsEvents } from "@/lib/tvs";
import { toTvsEventVM } from "@/lib/tvs-view";
import { formatUsd } from "@/lib/format";
import { TOKENS } from "@/lib/nox";

export const metadata = { title: "Shield / Unshield" };
export const revalidate = 60;

export default async function WrapsPage() {
  const payload = await loadTvsEvents();

  const events: TvsEventVM[] = payload.events.map(toTvsEventVM);

  const byToken = TOKENS.map((t) => {
    const tokenEvents = events.filter(
      (e) => e.symbol === t.underlyingSymbol && e.chainId === t.chainId,
    );
    const shields = tokenEvents.filter((e) => e.direction === "shield");
    const unshields = tokenEvents.filter((e) => e.direction === "unshield");
    return { ...t, shields, unshields, total: tokenEvents.length };
  });

  return (
    <>
      <PageHeader kicker="Dashboards" title="Shield / Unshield">
        {payload.partial ? <WarnPill label="Partial sync" /> : null}
        <LivePill />
      </PageHeader>

      <main id="content" className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
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
                  <ChainBadge chainId={t.chainId} />
                </div>
                <span className="font-mono text-[11px] text-[var(--color-muted)]">
                  {t.total.toLocaleString()} events
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-positive)]">
                    Shield
                  </div>
                  <div className="mt-1 font-display text-[22px] font-medium">
                    {t.shields.length.toLocaleString()}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-[var(--color-muted)]">
                    {formatUsd(t.shields.reduce((s, e) => s + e.amountUsd, 0))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-negative)]">
                    Unshield
                  </div>
                  <div className="mt-1 font-display text-[22px] font-medium">
                    {t.unshields.length.toLocaleString()}
                  </div>
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
    </>
  );
}
