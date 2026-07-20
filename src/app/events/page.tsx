import { EventsTable, EVENTS_PAGE_SIZE, type EventRow } from "@/components/EventsTable";
import { param, paginate, matchesQuery, type SearchParams } from "@/lib/table";
import { ARB_SEPOLIA_ID, ETH_SEPOLIA_ID } from "@/lib/nox";
import { PageHeader, LivePill, WarnPill } from "@/components/PageHeader";
import { StatTiles } from "@/components/StatTiles";
import { scanHandles } from "@/lib/subgraph";
import { opCategory } from "@/lib/nox";

export const metadata = { title: "Nox Events" };
export const revalidate = 60;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { items: handles, complete } = await scanHandles({
    pageSize: 1000,
    maxPages: 12,
  });

  const rows: EventRow[] = handles.map((h) => ({
    ...h,
    category: opCategory(h.operator),
  }));

  const publicCount = rows.filter((r) => r.isPubliclyDecryptable).length;

  const cat = param(sp, "cat");
  const chain = param(sp, "chain");
  const q = param(sp, "q");
  const wantChain =
    chain === "arb" ? ARB_SEPOLIA_ID : chain === "eth" ? ETH_SEPOLIA_ID : undefined;

  const visible = rows.filter((r) => {
    if (cat && r.category !== cat) return false;
    if (wantChain !== undefined && r.chainId !== wantChain) return false;
    return matchesQuery(q, r.operator, r.transactionHash);
  });
  const paged = paginate(visible, param(sp, "page"), EVENTS_PAGE_SIZE);

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

        <EventsTable
          pathname="/events"
          searchParams={sp}
          rows={paged.rows}
          page={paged.page}
          totalPages={paged.totalPages}
          filtered={paged.filtered}
          total={rows.length}
          from={paged.from}
          to={paged.to}
        />
      </main>
    </>
  );
}
