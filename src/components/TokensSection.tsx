import { formatTokenAmount, formatUsd, shortAddress } from "@/lib/format";
import type { TokenStats } from "@/lib/data";
import { Reveal } from "./Reveal";

export function TokensSection({ tokens }: { tokens: TokenStats[] }) {
  return (
    <section className="relative py-20 lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <SectionLabel kicker="Wrapped" title="Confidential tokens, fully backed." />
        <p className="mt-3 max-w-2xl text-[15px] leading-[1.55] text-[var(--color-muted)]">
          Every confidential token is 1:1 backed by an ERC-20. Wrap to encrypt, unwrap to redeem —
          the backing reserve is always public and auditable.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {tokens.map((t, i) => (
            <Reveal key={t.id} delay={0.1 + i * 0.08}>
              <TokenCard token={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TokenCard({ token }: { token: TokenStats }) {
  const tvlNative = formatTokenAmount(token.tvl, token.decimals, 2);
  const tvsNative = formatTokenAmount(token.tvs, token.decimals, 2);
  const unwrapsNative = formatTokenAmount(token.cumulativeUnwraps, token.decimals, 2);
  return (
    <article
      className="surface surface-hover relative overflow-hidden rounded-2xl p-7"
      style={{ ["--accent" as never]: token.accent }}
    >
      <div
        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full opacity-25 blur-3xl"
        style={{ background: token.accent }}
      />

      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TokenGlyph symbol={token.symbol} accent={token.accent} />
            <h3 className="font-display text-[22px] font-medium tracking-tight">{token.symbol}</h3>
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
              ERC-7984
            </span>
          </div>
          <p className="mt-2 text-[14px] text-[var(--color-muted)]">{token.description}</p>
        </div>
        <a
          href={`https://sepolia.arbiscan.io/address/${token.wrapper}`}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-lg border border-[var(--color-border)] px-2.5 py-1 font-mono text-[11px] text-[var(--color-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-white"
        >
          {shortAddress(token.wrapper)} ↗
        </a>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-4 border-y border-[var(--color-border)] py-6">
        <Metric
          label="TVL"
          usd={formatUsd(token.tvlUsd)}
          native={`${tvlNative} ${token.underlyingSymbol}`}
          color={token.accent}
        />
        <Metric
          label="TVS"
          usd={formatUsd(token.tvsUsd)}
          native={`${tvsNative} ${token.underlyingSymbol}`}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[12px]">
        <div className="flex items-center gap-3 font-mono text-[var(--color-muted)]">
          <span>
            <span className="text-[var(--color-muted-2)]">Unwrapped:</span> {unwrapsNative}{" "}
            {token.underlyingSymbol}
          </span>
          <span className="text-[var(--color-muted-2)]">·</span>
          <span>
            <span className="text-[var(--color-muted-2)]">Events:</span> {token.unwrapCount}
          </span>
          <span className="text-[var(--color-muted-2)]">·</span>
          <span>
            <span className="text-[var(--color-muted-2)]">Holders:</span>{" "}
            {token.holderCount > 0 ? token.holderCount.toLocaleString() : "—"}
          </span>
          {!token.unwrapsScanned ? (
            <span className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300/90">
              ponder unavailable
            </span>
          ) : null}
        </div>
        <KvRow label="Underlying" value={shortAddress(token.underlyingResolved)} />
      </div>
    </article>
  );
}

function Metric({
  label,
  usd,
  native,
  color,
}: {
  label: string;
  usd: string;
  native: string;
  color?: string;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
        {label}
      </div>
      <div
        className="display-num font-display mt-2 text-3xl font-medium leading-none sm:text-4xl"
        style={color ? { color } : undefined}
      >
        {usd}
      </div>
      <div className="mt-2 font-mono text-[12px] text-[var(--color-muted)]">{native}</div>
    </div>
  );
}

function KvRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted-2)]">{label}</span>
      <span className="font-mono text-[12px] text-white/85">{value}</span>
    </div>
  );
}

function TokenGlyph({ symbol, accent }: { symbol: string; accent: string }) {
  return (
    <span
      aria-hidden
      className="grid size-7 place-items-center rounded-full text-[10px] font-bold text-black"
      style={{ background: accent }}
    >
      {symbol.replace(/^c/, "")[0]}
    </span>
  );
}

function SectionLabel({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
        {kicker}
      </div>
      <h2 className="font-display mt-2 text-[36px] font-medium leading-[1.05] tracking-[-0.03em] sm:text-[44px]">
        {title}
      </h2>
    </div>
  );
}
