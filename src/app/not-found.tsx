import Link from "next/link";

export default function NotFound() {
  return (
    <main id="content" className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="surface-solid max-w-lg rounded-2xl p-8 text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted-2)]">
          404
        </div>
        <h1 className="font-display mt-3 text-[24px] font-medium tracking-tight">
          No such page.
        </h1>
        <p className="mt-3 text-[14px] leading-[1.55] text-[var(--color-muted)]">
          The route you asked for does not exist. Everything the dashboard can show is
          listed in the sidebar.
        </p>
        <Link href="/" className="btn-yellow mt-6 inline-flex items-center gap-2">
          Back to the TVS dashboard
        </Link>
      </div>
    </main>
  );
}
