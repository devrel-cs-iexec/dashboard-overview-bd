import { formatCompactNumber } from "@/lib/format";
import type { DashboardData } from "@/lib/data";
import { Reveal } from "./Reveal";

const CATEGORY_META: Record<
  string,
  { label: string; description: string; color: string }
> = {
  token: {
    label: "Token",
    description: "Mint, Burn, Transfer of encrypted balances",
    color: "#FFD21F",
  },
  arithmetic: {
    label: "Arithmetic",
    description: "Homomorphic Add, Sub, Mul, Div and safe variants",
    color: "#A78BFA",
  },
  comparison: {
    label: "Comparison",
    description: "Encrypted Eq, Ne, Lt, Gt for branching logic",
    color: "#2775CA",
  },
  control: {
    label: "Control flow",
    description: "Conditional select and plaintext wraps",
    color: "#34D399",
  },
  acl: {
    label: "ACL",
    description: "Access grants and viewer registration",
    color: "#F472B6",
  },
  other: {
    label: "Other",
    description: "Uncategorized operations",
    color: "#9CA3AF",
  },
};

export function OpsSection({ data }: { data: DashboardData }) {
  const total = Object.values(data.ops).reduce((a, b) => a + b, 0);
  const ordered = Object.entries(data.ops)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <section className="relative py-20 lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
              Compute
            </div>
            <h2 className="font-display mt-2 text-[36px] font-medium leading-[1.05] tracking-[-0.03em] sm:text-[44px]">
              Every operation, attested.
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-[1.55] text-[var(--color-muted)]">
              Each handle below corresponds to an encrypted operation executed inside a TEE and
              proved on-chain. Categories reflect the primitive type of the underlying computation.
            </p>

            <Reveal delay={0.05}>
              <div className="surface mt-8 rounded-2xl p-6 lg:p-7">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
                  Top operators
                </div>
                <ol className="mt-4 space-y-2.5">
                  {data.topOperators.slice(0, 6).map((op, i) => {
                    const pct = total === 0 ? 0 : (op.count / total) * 100;
                    return (
                      <li key={op.operator} className="group flex items-center gap-3">
                        <span className="w-6 font-mono text-[11px] text-[var(--color-muted-2)]">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="flex flex-1 items-center gap-3">
                          <span className="min-w-0 truncate text-[14px] font-medium">
                            {op.operator}
                          </span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-border)]">
                            <div
                              className="h-full rounded-full bg-[var(--color-accent)]/80 transition-all duration-700"
                              style={{ width: `${Math.max(2, pct)}%` }}
                            />
                          </div>
                          <span className="w-16 text-right font-mono text-[12px] text-[var(--color-muted)]">
                            {formatCompactNumber(op.count, 1)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ordered.map(([cat, count], i) => {
              const meta = CATEGORY_META[cat] ?? CATEGORY_META.other;
              const pct = total === 0 ? 0 : (count / total) * 100;
              return (
                <Reveal key={cat} delay={0.08 + i * 0.05}>
                  <article className="surface surface-hover relative h-full overflow-hidden rounded-xl p-5">
                    <div
                      className="absolute -top-12 -right-12 size-36 rounded-full opacity-20 blur-3xl"
                      style={{ background: meta.color }}
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
                        {meta.label}
                      </div>
                      <span
                        className="size-2 rounded-full"
                        style={{ background: meta.color }}
                      />
                    </div>
                    <div className="display-num font-display mt-4 text-3xl font-medium">
                      {formatCompactNumber(count, 1)}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-[var(--color-muted)]">
                      {pct.toFixed(1)}% of total
                    </div>
                    <p className="mt-3 text-[12px] leading-[1.5] text-[var(--color-muted)]">
                      {meta.description}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
