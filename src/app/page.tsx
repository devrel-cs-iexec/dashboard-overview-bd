import { TvsTable, TVS_PAGE_SIZE, type TvsEventVM } from "@/components/TvsTable";
import { PageHeader, LivePill, WarnPill } from "@/components/PageHeader";
import { StatTiles } from "@/components/StatTiles";
import { loadTvsEvents } from "@/lib/tvs";
import { toTvsEventVM, filterTvsEvents, tvsTokenOptions } from "@/lib/tvs-view";
import { param, paginate, type SearchParams } from "@/lib/table";
import { formatUsd } from "@/lib/format";

export const revalidate = 60;

export default async function TvsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const payload = await loadTvsEvents();

  const events: TvsEventVM[] = payload.events.map(toTvsEventVM);

  const visible = filterTvsEvents(events, {
    token: param(sp, "token"),
    dir: param(sp, "dir"),
    q: param(sp, "q"),
  });
  const paged = paginate(visible, param(sp, "page"), TVS_PAGE_SIZE);

  const shieldCount = events.filter((e) => e.direction === "shield").length;
  const unshieldCount = events.filter((e) => e.direction === "unshield").length;
  const netUsd = payload.shieldedUsd - payload.unshieldedUsd;

  return (
    <>
      <PageHeader kicker="Dashboards" title="TVS Dashboard">
        {payload.partial ? (
          <WarnPill label="Partial sync · some logs unavailable" />
        ) : (
          <LivePill />
        )}
      </PageHeader>

      <main id="content" className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
        <p className="max-w-3xl text-[14px] leading-[1.55] text-[var(--color-muted)]">
          Every confidential token shield (ERC-20 → ERC-7984) and unshield event since the
          protocol&apos;s deploy block. Shield amounts from ERC-20 Transfer logs; unshield
          amounts from on-chain UnwrapFinalized events (plaintext amount revealed
          post-finalization).
        </p>

        <div className="mt-6">
          <StatTiles
            stats={[
              {
                label: "Total shielded",
                value: formatUsd(payload.shieldedUsd),
                sub: `${shieldCount.toLocaleString()} events`,
                color: "var(--color-positive)",
              },
              {
                label: "Total unshielded",
                value: formatUsd(payload.unshieldedUsd),
                sub: `${unshieldCount.toLocaleString()} events`,
                color: "var(--color-negative)",
              },
              {
                label: "Net flow",
                value: `${netUsd >= 0 ? "+" : "−"}${formatUsd(Math.abs(netUsd))}`,
                sub: netUsd >= 0 ? "Net inflow" : "Net outflow",
                color: "var(--color-accent)",
              },
              {
                label: "Total events",
                value: events.length.toLocaleString(),
                sub: "all-time",
                color: "var(--color-warm)",
              },
            ]}
          />
        </div>

        <div className="mt-8">
          <TvsTable
            pathname="/"
            searchParams={sp}
            rows={paged.rows}
            tokenOptions={tvsTokenOptions(events)}
            page={paged.page}
            totalPages={paged.totalPages}
            filtered={paged.filtered}
            total={events.length}
            from={paged.from}
            to={paged.to}
          />
        </div>
      </main>
    </>
  );
}
