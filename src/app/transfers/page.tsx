import { TopNav } from "@/components/TopNav";
import { LiveRefresh } from "@/components/LiveRefresh";
import { Sidebar } from "@/components/Sidebar";
import { scanConfidentialTransfers } from "@/lib/ponder";
import { getPrices } from "@/lib/price";
import { relativeTime, shortAddress, explorerTx, explorerAddress } from "@/lib/format";
import { ChainBadge } from "@/components/ChainBadge";
import { TOKENS } from "@/lib/nox";

export const revalidate = 60;

const KIND_STYLE = {
  MINT: { label: "Mint", color: "var(--color-positive)" },
  BURN: { label: "Burn", color: "var(--color-negative)" },
  TRANSFER: { label: "Transfer", color: "#38bdf8" },
} as const;

function resolveTokenSymbol(address: string): string {
  const found = TOKENS.find((t) => t.wrapper.toLowerCase() === address.toLowerCase());
  return found?.symbol ?? shortAddress(address);
}

export default async function TransfersPage() {
  const [result, prices] = await Promise.all([
    scanConfidentialTransfers(200),
    getPrices().catch(() => null),
  ]);

  const { items: transfers, online: ponderOnline } = result;
  const mintCount = transfers.filter((t) => t.kind === "MINT").length;
  const burnCount = transfers.filter((t) => t.kind === "BURN").length;
  const xferCount = transfers.filter((t) => t.kind === "TRANSFER").length;

  return (
    <div className="min-h-screen">
      <TopNav />
      <LiveRefresh />
      <div className="flex">
        <Sidebar rlcPrice={prices?.rlc} activeKey="transfers" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/40 px-6 py-4 backdrop-blur lg:px-10">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted-2)]">Dashboards</div>
              <h1 className="font-display mt-1 text-[22px] font-medium tracking-tight">Confidential Transfers</h1>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
              <span className={`pulse-dot inline-block size-1.5 rounded-full ${transfers.length > 0 ? "bg-[var(--color-positive)]" : ponderOnline ? "bg-blue-400" : "bg-amber-400"}`} />
              {transfers.length > 0 ? "Ponder · ISR 60s" : ponderOnline ? "Ponder syncing" : "Ponder offline"}
            </span>
          </div>

          <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
            <p className="mb-6 max-w-2xl text-[14px] leading-[1.55] text-[var(--color-muted)]">
              ERC-7984 token events indexed by Ponder. Transfer amounts are encrypted (euint256 handle) — only the sender, receiver, and event type are visible on-chain.
            </p>

            {transfers.length === 0 ? (
              <div className="surface-solid rounded-2xl px-8 py-16 text-center">
                {ponderOnline ? (
                  <>
                    <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-blue-400">Ponder syncing</div>
                    <p className="text-[14px] text-[var(--color-muted)]">
                      The Ponder indexer is running and backfilling on-chain data. Refresh in a few minutes once indexing catches up.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-amber-400">Ponder offline</div>
                    <p className="text-[14px] text-[var(--color-muted)]">
                      Start the Ponder indexer (<code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px]">npm run start</code> in the indexer repo) to populate this feed.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] lg:grid-cols-4">
                  {[
                    { label: "Total events", value: transfers.length.toLocaleString(), color: undefined },
                    { label: "Mints", value: mintCount.toLocaleString(), color: "var(--color-positive)" },
                    { label: "Burns", value: burnCount.toLocaleString(), color: "var(--color-negative)" },
                    { label: "Transfers", value: xferCount.toLocaleString(), color: "#38bdf8" },
                  ].map((t) => (
                    <div key={t.label} className="bg-[var(--color-surface)] p-5 lg:p-6">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">{t.label}</div>
                      <div
                        className="display-num font-display mt-3 text-3xl font-medium leading-none lg:text-4xl"
                        style={t.color ? { color: t.color } : undefined}
                      >
                        {t.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="surface-solid overflow-hidden rounded-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[var(--color-border)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
                          <th className="px-5 py-3 font-mono font-normal sm:px-7">Type</th>
                          <th className="px-5 py-3 font-mono font-normal sm:px-7">Chain</th>
                          <th className="px-5 py-3 font-mono font-normal sm:px-7">From</th>
                          <th className="px-5 py-3 font-mono font-normal sm:px-7">To</th>
                          <th className="px-5 py-3 font-mono font-normal sm:px-7">Token</th>
                          <th className="px-5 py-3 font-mono font-normal sm:px-7">Time</th>
                          <th className="px-5 py-3 text-right font-mono font-normal sm:px-7">Tx</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transfers.map((t) => {
                          const style = KIND_STYLE[t.kind];
                          return (
                            <tr
                              key={t.id}
                              className="border-b border-[var(--color-border)]/60 transition-colors last:border-0 hover:bg-white/[0.02]"
                            >
                              <td className="px-5 py-3 sm:px-7">
                                <span
                                  className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]"
                                  style={{
                                    color: style.color,
                                    borderColor: `${style.color}40`,
                                    backgroundColor: `${style.color}12`,
                                  }}
                                >
                                  {style.label}
                                </span>
                              </td>
                              <td className="px-5 py-3 sm:px-7">
                                <ChainBadge chainId={t.chainId} />
                              </td>
                              <td className="px-5 py-3 font-mono text-[12px] sm:px-7">
                                {t.from === "0x0000000000000000000000000000000000000000" ? (
                                  <span className="text-[var(--color-muted-2)]">—</span>
                                ) : (
                                  <a href={explorerAddress(t.chainId, t.from)} target="_blank" rel="noreferrer" className="text-[var(--color-foreground)]/85 hover:text-[var(--color-accent)]">
                                    {shortAddress(t.from)}
                                  </a>
                                )}
                              </td>
                              <td className="px-5 py-3 font-mono text-[12px] sm:px-7">
                                {t.to === "0x0000000000000000000000000000000000000000" ? (
                                  <span className="text-[var(--color-muted-2)]">—</span>
                                ) : (
                                  <a href={explorerAddress(t.chainId, t.to)} target="_blank" rel="noreferrer" className="text-[var(--color-foreground)]/85 hover:text-[var(--color-accent)]">
                                    {shortAddress(t.to)}
                                  </a>
                                )}
                              </td>
                              <td className="px-5 py-3 font-mono text-[12px] text-[var(--color-muted)] sm:px-7">
                                {resolveTokenSymbol(t.token)}
                              </td>
                              <td className="px-5 py-3 font-mono text-[11px] text-[var(--color-muted)] sm:px-7">
                                {relativeTime(Number(t.timestamp))}
                              </td>
                              <td className="px-5 py-3 text-right sm:px-7">
                                <a href={explorerTx(t.chainId, t.transactionHash)} target="_blank" rel="noreferrer" className="font-mono text-[12px] text-[var(--color-muted)] hover:text-[var(--color-accent)]">
                                  {shortAddress(t.transactionHash)} ↗
                                </a>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
