import Link from "next/link";
import { buildHref, type SearchParams } from "@/lib/table";

export type FilterOption = {
  /** Value written to the URL. `undefined` clears the param (the "all" case). */
  value: string | undefined;
  label: string;
  /** Optional colour dot, used for the token chips. */
  accent?: string;
};

/**
 * A group of filter links.
 *
 * These are links rather than buttons because the filter now lives in the URL:
 * that makes a filtered view shareable and back/forward-navigable, and lets the
 * server send one page of rows instead of the whole set. `aria-current` marks
 * the active one — for a link that is the correct signal, where aria-pressed
 * would imply a toggle button.
 */
export function FilterLinks({
  pathname,
  searchParams,
  name,
  label,
  options,
  active,
}: {
  pathname: string;
  searchParams: SearchParams;
  name: string;
  label: string;
  options: FilterOption[];
  active: string | undefined;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-wrap items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 p-1"
    >
      {options.map((opt) => {
        const isActive = (opt.value ?? undefined) === (active ?? undefined);
        return (
          <Link
            key={opt.value ?? "__all"}
            href={buildHref(pathname, searchParams, {
              [name]: opt.value,
              page: undefined,
            })}
            aria-current={isActive ? "true" : undefined}
            className={`focus-ring inline-flex items-center gap-1.5 rounded px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
              isActive
                ? "bg-[var(--color-accent-dim)] text-[var(--color-accent-soft)]"
                : "text-[var(--color-muted)] hover:text-white"
            }`}
          >
            {opt.accent ? (
              <span
                aria-hidden
                className="inline-block size-2 shrink-0 rounded-full"
                style={{ background: opt.accent }}
              />
            ) : null}
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Search box for a table. A plain GET form, so it works without JS; other
 * active filters ride along as hidden inputs and `page` is deliberately not
 * carried over.
 */
export function TableSearch({
  pathname,
  searchParams,
  name = "q",
  label,
  placeholder,
  filtered,
  total,
}: {
  pathname: string;
  searchParams: SearchParams;
  name?: string;
  label: string;
  placeholder: string;
  filtered: number;
  total: number;
}) {
  const carry = Object.entries(searchParams).filter(([k]) => k !== name && k !== "page");
  const id = `table-search-${name}`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span
        role="status"
        aria-live="polite"
        className="font-mono text-[11px] text-[var(--color-muted-2)]"
      >
        {filtered.toLocaleString()} / {total.toLocaleString()}
      </span>
      <form method="get" action={pathname} className="flex items-center gap-2">
        {carry.map(([k, v]) => {
          const s = Array.isArray(v) ? v[0] : v;
          return s ? <input key={k} type="hidden" name={k} value={s} /> : null;
        })}
        <label htmlFor={id} className="visually-hidden">
          {label}
        </label>
        <input
          id={id}
          type="text"
          name={name}
          defaultValue={(searchParams[name] as string) ?? ""}
          placeholder={placeholder}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-3 py-1.5 font-mono text-[12px] text-white placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-accent)] sm:w-56"
        />
        <button
          type="submit"
          className="focus-ring rounded-md border border-[var(--color-border)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-muted)] hover:text-white"
        >
          Go
        </button>
      </form>
    </div>
  );
}

/** Prev/next pagination as links, so pages are addressable and shareable. */
export function TablePagination({
  pathname,
  searchParams,
  page,
  totalPages,
  from,
  to,
  filtered,
  noun,
}: {
  pathname: string;
  searchParams: SearchParams;
  page: number;
  totalPages: number;
  from: number;
  to: number;
  filtered: number;
  noun: string;
}) {
  const prev = page > 1 ? String(page - 1) : undefined;
  const nextPage = page < totalPages ? String(page + 1) : undefined;

  return (
    <div className="flex flex-col items-start gap-3 border-t border-[var(--color-border)] px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-7">
      <span className="font-mono text-[11px] text-[var(--color-muted-2)]">
        {from}–{to} of {filtered.toLocaleString()} {noun}
      </span>
      <div className="flex items-center gap-1">
        <PageLink
          href={prev && buildHref(pathname, searchParams, { page: prev })}
          label="Previous page"
        >
          ← Prev
        </PageLink>
        <span className="px-3 font-mono text-[11px] text-[var(--color-muted)]">
          {page} / {totalPages}
        </span>
        <PageLink
          href={nextPage && buildHref(pathname, searchParams, { page: nextPage })}
          label="Next page"
        >
          Next →
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({
  href,
  label,
  children,
}: {
  href: string | undefined;
  label: string;
  children: React.ReactNode;
}) {
  const base =
    "rounded border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-2.5 py-1 font-mono text-[11px]";

  // At the first or last page there is nowhere to go; render inert text rather
  // than a link to nothing.
  if (!href) {
    return (
      <span aria-disabled="true" className={`${base} opacity-40`}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className={`focus-ring ${base} hover:text-white`}
    >
      {children}
    </Link>
  );
}
