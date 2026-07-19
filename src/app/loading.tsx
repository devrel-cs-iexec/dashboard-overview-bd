/**
 * Streamed while a page's server data resolves. The uncached routes
 * (/address, /block, /search, /verify) and the multi-second indexer scans
 * previously rendered nothing at all during that wait.
 */
export default function Loading() {
  return (
    <>
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/40 px-6 py-4 backdrop-blur lg:px-10">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton mt-2 h-5 w-48 rounded" />
      </div>
      <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
        <span className="visually-hidden" role="status">
          Loading dashboard data
        </span>
        <div className="skeleton h-4 w-full max-w-2xl rounded" />
        <div className="skeleton mt-2 h-4 w-2/3 max-w-md rounded" />

        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[var(--color-surface)] p-5 lg:p-6">
              <div className="skeleton h-3 w-24 rounded" />
              <div className="skeleton mt-3 h-8 w-32 rounded" />
              <div className="skeleton mt-3 h-3 w-20 rounded" />
            </div>
          ))}
        </div>

        <div className="surface-solid mt-8 overflow-hidden rounded-2xl">
          <div className="border-b border-[var(--color-border)] px-5 py-4 sm:px-7">
            <div className="skeleton h-4 w-40 rounded" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-[var(--color-border)]/60 px-5 py-4 last:border-0 sm:px-7"
            >
              <div className="skeleton h-3 flex-1 rounded" />
              <div className="skeleton h-3 w-16 rounded" />
              <div className="skeleton h-3 w-24 rounded" />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
