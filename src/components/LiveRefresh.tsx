"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Periodically re-runs the server components for the current route.
 *
 * Refreshes are skipped while the tab is hidden — each one re-executes the
 * whole server tree (indexer queries, RPC calls, price fetch), so a
 * backgrounded tab was previously generating hundreds of pointless round-trips
 * overnight. On becoming visible again we refresh once immediately, since the
 * data is stale by definition at that point.
 */
export function LiveRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };

    const id = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, intervalMs]);

  return null;
}
