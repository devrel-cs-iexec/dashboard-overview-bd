import { loadTvsEvents } from "@/lib/tvs";
import {
  explorerAddress,
  explorerTx,
  formatTokenAmount,
  formatUsd,
  relativeTime,
  shortAddress,
} from "@/lib/format";

export async function RecentActivityLight() {
  const { events, prices } = await loadTvsEvents();
  const top = events.slice(0, 24);

  const lastTs = top[0]?.timestamp;
  const updated = lastTs
    ? new Date(lastTs * 1000).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : "—";

  return (
    <section className="bg-[var(--color-page-2)]">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-lavender)]">
              Recent activity
            </div>
            <h2 className="font-display mt-3 text-[32px] font-medium leading-[1.08] tracking-[-0.02em] text-[var(--color-page-fg)] sm:text-[40px]">
              Merged feed from every indexed wrapper.
            </h2>
            <p className="mt-3 max-w-md text-[14px] leading-[1.55] text-[var(--color-page-muted)]">
              Click an address to open its full activity profile in the app.
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-[var(--color-page-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[var(--color-positive)]" />
              Updated {updated}
            </span>
            {prices.live ? (
              <span>RLC ${prices.rlc.toFixed(4)}</span>
            ) : null}
          </div>
        </div>

        <div className="card-light mt-8 overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-[var(--color-page-border)] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-page-muted)] sm:grid-cols-[1fr_2fr_auto_auto] sm:px-7">
            <span>Actor</span>
            <span className="hidden sm:block">Activity</span>
            <span>Time</span>
            <span className="text-right">Tx</span>
          </div>
          <ul className="divide-y divide-[var(--color-page-border)]">
            {top.map((e) => (
              <li
                key={e.id}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--color-page-3)] sm:grid-cols-[1fr_2fr_auto_auto] sm:px-7"
              >
                <a
                  href={explorerAddress(e.chainId, e.account)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[12px] text-[var(--color-page-fg)] hover:text-[var(--color-lavender)]"
                >
                  {shortAddress(e.account)}
                </a>
                <span className="hidden text-[12.5px] text-[var(--color-page-fg)]/85 sm:block">
                  <span className="text-[var(--color-page-muted)]">
                    {e.symbol === "USDC" ? "Confidential / Stable" : "Confidential / RLC"}
                  </span>
                  <span className="mx-1.5 text-[var(--color-page-border-strong)]">·</span>
                  <span
                    className={
                      e.direction === "shield"
                        ? "text-[var(--color-positive)]"
                        : "text-[var(--color-negative)]"
                    }
                  >
                    {e.direction === "shield" ? "Shield" : "Unshield"}
                  </span>
                  <span className="ml-2 font-mono text-[var(--color-page-muted)]">
                    {formatTokenAmount(e.amount, e.decimals, 2)} {e.symbol}
                    <span className="ml-1.5 opacity-80">{formatUsd(e.amountUsd)}</span>
                  </span>
                </span>
                <span className="font-mono text-[11px] text-[var(--color-page-muted)]">
                  {e.timestamp ? relativeTime(e.timestamp) : "—"}
                </span>
                <a
                  href={explorerTx(e.chainId, e.transactionHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-[var(--color-page-border)] px-2 py-0.5 text-right font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-page-muted)] transition-colors hover:border-[var(--color-page-border-strong)] hover:text-[var(--color-page-fg)]"
                >
                  Tx
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-page-muted)]">
          Built for iex.ec — open the dashboard for the full experience with sidebar and tools.
        </p>
      </div>
    </section>
  );
}
