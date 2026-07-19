"use client";

import { useEffect } from "react";

/**
 * Catches throws from any dashboard page. Several data paths (loadTvsEvents in
 * particular) rethrow when the RPC is unreachable and there is no warm cache,
 * which previously surfaced as a raw 500.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard route error:", error);
  }, [error]);

  return (
    <main id="content" className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="surface-solid max-w-lg rounded-2xl p-8 text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-negative)]">
          Something broke
        </div>
        <h1 className="font-display mt-3 text-[24px] font-medium tracking-tight">
          This view could not be loaded.
        </h1>
        <p className="mt-3 text-[14px] leading-[1.55] text-[var(--color-muted)]">
          One of the upstream dependencies — an RPC endpoint, the Ponder indexer, or the
          price feed — did not answer. The data is not lost; the request simply failed.
          Check{" "}
          <a href="/status" className="text-[var(--color-accent)] hover:underline">
            System Status
          </a>{" "}
          to see which one.
        </p>
        {error.digest ? (
          <p className="mt-4 font-mono text-[11px] text-[var(--color-muted-2)]">
            digest {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="btn-yellow mt-6 inline-flex items-center gap-2"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
