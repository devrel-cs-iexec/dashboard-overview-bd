import { TopNav } from "@/components/TopNav";
import { LiveRefresh } from "@/components/LiveRefresh";
import { Sidebar } from "@/components/Sidebar";
import { EventsTable, type EventRow } from "@/components/EventsTable";
import { scanHandles } from "@/lib/subgraph";
import { opCategory } from "@/lib/nox";
import { getPrices } from "@/lib/price";

export const revalidate = 60;

export default async function EventsPage() {
  const [handles, prices] = await Promise.all([
    scanHandles({ pageSize: 1000, maxPages: 12 }),
    getPrices().catch(() => null),
  ]);

  const rows: EventRow[] = handles.map((h) => ({
    ...h,
    category: opCategory(h.operator),
  }));

  const publicCount = rows.filter((r) => r.isPubliclyDecryptable).length;

  return (
    <div className="min-h-screen">
      <TopNav />
      <LiveRefresh />
      <div className="flex">
        <Sidebar rlcPrice={prices?.rlc} activeKey="events" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/40 px-6 py-4 backdrop-blur lg:px-10">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted-2)]">Dashboards</div>
              <h1 className="font-display mt-1 text-[22px] font-medium tracking-tight">Nox Events</h1>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
              <span className="pulse-dot inline-block size-1.5 rounded-full bg-[var(--color-positive)]" />
              Live · ISR 60s
            </span>
          </div>

          <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
            <p className="mb-6 max-w-2xl text-[14px] leading-[1.55] text-[var(--color-muted)]">
              Every compute operation recorded on-chain since the protocol deployed — arithmetic, comparisons, token ops, and ACL changes.
            </p>

            <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] lg:grid-cols-4">
              {[
                { label: "Total events", value: rows.length.toLocaleString(), sub: "all-time" },
                { label: "Publicly decryptable", value: publicCount.toLocaleString(), sub: `${rows.length ? ((publicCount / rows.length) * 100).toFixed(1) : 0}% of all` },
                { label: "Unique ops", value: new Set(rows.map((r) => r.operator)).size.toLocaleString(), sub: "distinct operation types" },
                { label: "Unique txs", value: new Set(rows.map((r) => r.transactionHash)).size.toLocaleString(), sub: "distinct transactions" },
              ].map((t) => (
                <div key={t.label} className="bg-[var(--color-surface)] p-5 lg:p-6">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">{t.label}</div>
                  <div className="display-num font-display mt-3 text-3xl font-medium leading-none lg:text-4xl">{t.value}</div>
                  <div className="mt-2 font-mono text-[11px] text-[var(--color-muted)]">{t.sub}</div>
                </div>
              ))}
            </div>

            <EventsTable rows={rows} />
          </main>
        </div>
      </div>
    </div>
  );
}
