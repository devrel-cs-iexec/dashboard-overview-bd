import type { ReactNode } from "react";

/**
 * The strip above every dashboard page: section kicker, page title, and an
 * optional status slot on the right.
 */
export function PageHeader({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]/40 px-6 py-4 backdrop-blur lg:px-10">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted-2)]">
          {kicker}
        </div>
        <h1 className="font-display mt-1 text-[22px] font-medium tracking-tight">
          {title}
        </h1>
      </div>
      {children ? (
        <div className="hidden items-center gap-3 sm:flex">{children}</div>
      ) : null}
    </div>
  );
}

/** "Live · ISR 60s"-style pill. Used by every auto-refreshing page. */
export function LivePill({ label = "Live · ISR 60s" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
      <span className="pulse-dot inline-block size-1.5 rounded-full bg-[var(--color-positive)] text-[var(--color-positive)]" />
      {label}
    </span>
  );
}

/** Amber warning pill for degraded / partial data. */
export function WarnPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-amber-300">
      {label}
    </span>
  );
}
