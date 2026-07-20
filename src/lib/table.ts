export type SearchParams = Record<string, string | string[] | undefined>;

/** First value for a key — Next gives an array when a param repeats. */
export function param(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() ? s.trim() : undefined;
}

/**
 * Builds a href with `patch` applied over the current params.
 *
 * A key set to undefined is dropped, which keeps the URL free of defaults like
 * `?token=all&page=1`. Filter links pass `page: undefined` so changing a filter
 * returns to the first page instead of a page that may no longer exist.
 */
export function buildHref(
  pathname: string,
  sp: SearchParams,
  patch: Record<string, string | undefined>,
): string {
  const next = new URLSearchParams();

  for (const [k, v] of Object.entries(sp)) {
    if (k in patch) continue;
    const s = Array.isArray(v) ? v[0] : v;
    if (s) next.set(k, s);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) next.set(k, v);
  }

  const qs = next.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export type Paginated<T> = {
  rows: T[];
  page: number;
  totalPages: number;
  /** Rows after filtering, before slicing. */
  filtered: number;
  /** 1-based index of the first row shown, 0 when empty. */
  from: number;
  /** 1-based index of the last row shown, 0 when empty. */
  to: number;
};

/**
 * Slices one page out of an already-filtered set.
 *
 * An out-of-range or malformed `page` clamps into range rather than yielding an
 * empty table, so a stale bookmark still renders something.
 */
export function paginate<T>(
  items: T[],
  pageParam: string | undefined,
  pageSize: number,
): Paginated<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const requested = Number.parseInt(pageParam ?? "1", 10);
  const page = Number.isFinite(requested)
    ? Math.min(Math.max(requested, 1), totalPages)
    : 1;

  const start = (page - 1) * pageSize;
  const rows = items.slice(start, start + pageSize);

  return {
    rows,
    page,
    totalPages,
    filtered: items.length,
    from: items.length === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, items.length),
  };
}

/** Case-insensitive substring match across the given fields. */
export function matchesQuery(query: string | undefined, ...fields: string[]): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(q));
}
