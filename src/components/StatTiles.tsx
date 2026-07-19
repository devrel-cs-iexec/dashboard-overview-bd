export type Stat = {
  label: string;
  value: string;
  sub?: string;
  /** Optional accent, shown as a dot beside the label and tinting the value. */
  color?: string;
};

/**
 * The KPI strip used at the top of most dashboard pages. The 1px gaps are the
 * container background showing through, which is why `gap-px` sits on a
 * border-coloured parent.
 */
export function StatTiles({
  stats,
  columns = 4,
}: {
  stats: Stat[];
  columns?: 2 | 3 | 4;
}) {
  const lg =
    columns === 2 ? "lg:grid-cols-2" : columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";
  return (
    <div
      className={`grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] ${lg}`}
    >
      {stats.map((s) => (
        <div key={s.label} className="bg-[var(--color-surface)] p-5 lg:p-6">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
            {s.color ? (
              <span
                aria-hidden
                className="inline-block size-1.5 shrink-0 rounded-full"
                style={{ background: s.color }}
              />
            ) : null}
            {s.label}
          </div>
          <div
            className="display-num font-display mt-3 text-3xl font-medium leading-none lg:text-4xl"
            style={s.color ? { color: s.color } : undefined}
          >
            {s.value}
          </div>
          {s.sub ? (
            <div className="mt-2 font-mono text-[11px] text-[var(--color-muted)]">
              {s.sub}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
