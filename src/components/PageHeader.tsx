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
