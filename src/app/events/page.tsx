import { EventsTable, type EventRow } from "@/components/EventsTable";
import { PageHeader, LivePill, WarnPill } from "@/components/PageHeader";
import { StatTiles } from "@/components/StatTiles";
import { scanHandles } from "@/lib/subgraph";
import { opCategory } from "@/lib/nox";

export const metadata = { title: "Nox Events" };
export const revalidate = 60;

export default async function EventsPage() {
  const { items: handles, complete } = await scanHandles({
    pageSize: 1000,
    maxPages: 12,
  });

  const rows: EventRow[] = handles.map((h) => ({
    ...h,
    category: opCategory(h.operator),
  }));

  const publicCount = rows.filter((r) => r.isPubliclyDecryptable).length;

  return (
    <>
      <PageHeader kicker="Dashboards" title="Nox Events">
        {complete ? <LivePill /> : <WarnPill label="Truncated · scan cap reached" />}
      </PageHeader>

      <main id="content" className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
        <p className="mb-6 max-w-2xl text-[14px] leading-[1.55] text-[var(--color-muted)]">
          Every compute operation recorded on-chain since the protocol deployed —
          arithmetic, comparisons, token ops, and ACL changes.
        </p>

        <div className="mb-8">
          <StatTiles
            stats={[
              {
                label: "Total events",
                value: `${complete ? "" : "\u2265"}${rows.length.toLocaleString()}`,
                sub: complete ? "all-time" : "scan cap reached",
              },
              {
                label: "Publicly decryptable",
                value: publicCount.toLocaleString(),
                sub: `${rows.length ? ((publicCount / rows.length) * 100).toFixed(1) : 0}% of all`,
              },
              {
                label: "Unique ops",
                value: new Set(rows.map((r) => r.operator)).size.toLocaleString(),
                sub: "distinct operation types",
              },
              {
                label: "Unique txs",
                value: new Set(rows.map((r) => r.transactionHash)).size.toLocaleString(),
                sub: "distinct transactions",
              },
            ]}
          />
        </div>

        <EventsTable rows={rows} />
      </main>
    </>
  );
}
