import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { LiveRefresh } from "@/components/LiveRefresh";
import { TvsTable, type TvsEventVM } from "@/components/TvsTable";
import { loadTvsEvents } from "@/lib/tvs";
import {
  formatTokenAmount,
  formatUsd,
  relativeTime,
  shortAddress,
} from "@/lib/format";

export const revalidate = 60;

export default async function TvsPage() {
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

  const shieldCount = events.filter((e) => e.direction === "shield").length;
  const unshieldCount = events.filter((e) => e.direction === "unshield").length;

  return (
    <div className="min-h-screen">
      <TopNav showOpenDashboard={false} />
      <LiveRefresh intervalMs={60_000} />
      <div className="flex">
        <Sidebar rlcPrice={payload.prices.rlc} activeKey="tvs" />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header partial={payload.partial} />

          <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
          <HeroStrip
            shieldedUsd={payload.shieldedUsd}
            unshieldedUsd={payload.unshieldedUsd}
            shieldCount={shieldCount}
            unshieldCount={unshieldCount}
            totalEvents={events.length}
          />

            <div className="mt-8">
              <TvsTable events={events} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Header({ partial }: { partial: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/40 px-6 py-4 backdrop-blur lg:px-10">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted-2)]">
          Dashboards
        </div>
        <h1 className="font-display mt-1 text-[22px] font-medium tracking-tight">
          TVS Dashboard
        </h1>
      </div>
      <div className="hidden items-center gap-3 sm:flex">
        {partial ? (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-amber-300">
            Partial sync · some logs unavailable
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
            <span className="pulse-dot inline-block size-1.5 rounded-full bg-[var(--color-positive)] text-[var(--color-positive)]" />
            Live · ISR 60s
          </span>
        )}
      </div>
    </div>
  );
}

function HeroStrip({
  shieldedUsd,
  unshieldedUsd,
  shieldCount,
  unshieldCount,
  totalEvents,
}: {
  shieldedUsd: number;
  unshieldedUsd: number;
  shieldCount: number;
  unshieldCount: number;
  totalEvents: number;
}) {
  const netUsd = shieldedUsd - unshieldedUsd;
  return (
    <section>
      <div className="max-w-3xl">
        <p className="text-[14px] leading-[1.55] text-[var(--color-muted)]">
          Every confidential token shield (ERC-20 → ERC-7984) and unshield event since
          the protocol&apos;s deploy block. Shield amounts from ERC-20 Transfer logs;
          unshield amounts from on-chain UnwrapFinalized events (plaintext amount revealed post-finalization).
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] lg:grid-cols-4">
        <Tile
          label="Total shielded"
          value={formatUsd(shieldedUsd)}
          subValue={`${shieldCount.toLocaleString()} events`}
          accent="var(--color-positive)"
        />
        <Tile
          label="Total unshielded"
          value={formatUsd(unshieldedUsd)}
          subValue={`${unshieldCount.toLocaleString()} events`}
          accent="var(--color-negative)"
        />
        <Tile
          label="Net flow"
          value={`${netUsd >= 0 ? "+" : "−"}${formatUsd(Math.abs(netUsd))}`}
          subValue={netUsd >= 0 ? "Net inflow" : "Net outflow"}
          accent="var(--color-accent)"
        />
        <Tile
          label="Total events"
          value={totalEvents.toLocaleString()}
          subValue="all-time"
          accent="var(--color-warm)"
        />
      </div>
    </section>
  );
}

function Tile({
  label,
  value,
  subValue,
  accent,
}: {
  label: string;
  value: string;
  subValue: string;
  accent: string;
}) {
  return (
    <div className="bg-[var(--color-surface)] p-5 lg:p-6">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
        <span className="inline-block size-1.5 rounded-full" style={{ background: accent }} />
        {label}
      </div>
      <div className="display-num font-display mt-3 text-3xl font-medium leading-none lg:text-4xl">
        {value}
      </div>
      <div className="mt-2 font-mono text-[11px] text-[var(--color-muted)]">{subValue}</div>
    </div>
  );
}
