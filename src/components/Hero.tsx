import { formatCompactNumber, formatTokenCompact, relativeTime } from "@/lib/format";
import type { DashboardData } from "@/lib/data";
import { Reveal } from "./Reveal";

export function Hero({ data }: { data: DashboardData }) {
  const tvsCompact = data.tokens
    .map((t) => `${formatTokenCompact(t.inferredTotalSupply, t.decimals)} ${t.underlyingSymbol}`)
    .join("  ·  ");

  return (
    <section className="relative isolate overflow-hidden pt-10 pb-20 lg:pt-16 lg:pb-28">
      <div className="bg-grid absolute inset-0 -z-10" />
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Reveal>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-3 py-1 text-[12px] text-[var(--color-muted)]">
            <span className="inline-block size-1.5 rounded-full bg-[var(--color-accent)]" />
            <span className="font-mono uppercase tracking-[0.18em]">
              Live · subgraph block #{data.meta.block.toLocaleString()}
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 className="font-display max-w-4xl text-[44px] font-medium leading-[1.04] tracking-[-0.04em] sm:text-[64px] lg:text-[80px]">
            Confidential DeFi,{" "}
            <span className="bg-gradient-to-r from-[var(--color-accent)] to-[#fff7c2] bg-clip-text text-transparent">
              in clear view.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-6 max-w-2xl text-[17px] leading-[1.55] text-[var(--color-muted)]">
            Nox Protocol secures encrypted balances inside trusted execution environments while
            keeping protocol-level activity fully verifiable on Arbitrum.
            Here is everything that has happened, in real time.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] lg:grid-cols-4">
          <Reveal delay={0.15} as="div">
            <HeroStat
              label="Total Value Secured"
              value={tvsCompact}
              subValue={`${data.tokens.length} confidential tokens`}
              accent="#FFD21F"
              big
            />
          </Reveal>
          <Reveal delay={0.2} as="div">
            <HeroStat
              label="Encrypted operations"
              value={formatCompactNumber(data.totals.handles, 1)}
              subValue={`${formatCompactNumber(data.totals.handlesLast24h, 0)} in last 24h`}
              accent="#A78BFA"
            />
          </Reveal>
          <Reveal delay={0.25} as="div">
            <HeroStat
              label="Active wallets"
              value={formatCompactNumber(
                data.totals.distinctAdmins + data.totals.distinctViewers,
                0,
              )}
              subValue={`${data.totals.distinctAdmins} admins · ${data.totals.distinctViewers} viewers`}
              accent="#2775CA"
            />
          </Reveal>
          <Reveal delay={0.3} as="div">
            <HeroStat
              label="Subgraph freshness"
              value={data.meta.lagSeconds < 60 ? "Live" : relativeTime(data.meta.timestamp)}
              subValue={`block ${data.meta.block.toLocaleString()}`}
              accent="#34D399"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function HeroStat({
  label,
  value,
  subValue,
  accent,
  big,
}: {
  label: string;
  value: string;
  subValue?: string;
  accent: string;
  big?: boolean;
}) {
  return (
    <div className="surface relative flex h-full flex-col justify-between gap-4 p-6 lg:p-7">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
        <span className="inline-block size-1.5 rounded-full" style={{ background: accent }} />
        {label}
      </div>
      <div
        className={`display-num font-display ${big ? "text-3xl sm:text-[34px] lg:text-[40px]" : "text-3xl sm:text-4xl lg:text-5xl"} font-medium leading-none`}
      >
        {value}
      </div>
      {subValue ? (
        <div className="font-mono text-[11px] text-[var(--color-muted)]">{subValue}</div>
      ) : null}
    </div>
  );
}
