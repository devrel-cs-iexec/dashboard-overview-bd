import { formatTokenAmount, shortAddress } from "@/lib/format";
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
  const supplyFormatted = formatTokenAmount(token.inferredTotalSupply, token.decimals, 2);
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

      <div className="mt-8 flex items-end justify-between gap-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
            Total Value Secured
          </div>
          <div
            className="display-num font-display mt-2 text-4xl font-medium leading-none sm:text-5xl"
            style={{ color: token.accent }}
          >
            {supplyFormatted}
          </div>
          <div className="mt-2 font-mono text-[12px] text-[var(--color-muted)]">
            {token.underlyingSymbol} locked · {token.decimals} decimals
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 text-right">
          <KvRow label="Wrapper" value={shortAddress(token.wrapper)} />
          <KvRow label="Underlying" value={shortAddress(token.underlyingResolved)} />
        </div>
      </div>
    </article>
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
