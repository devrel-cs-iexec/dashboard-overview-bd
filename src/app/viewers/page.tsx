import { TopNav } from "@/components/TopNav";
import { LiveRefresh } from "@/components/LiveRefresh";
import { Sidebar } from "@/components/Sidebar";
import { scanHandles } from "@/lib/subgraph";
import { getPrices } from "@/lib/price";
import { relativeTime, shortAddress, explorerTx } from "@/lib/format";
import { ChainBadge } from "@/components/ChainBadge";

export const revalidate = 60;

export default async function ViewersPage() {
  const [allHandles, prices] = await Promise.all([
    scanHandles({ pageSize: 1000, maxPages: 12 }),
    getPrices().catch(() => null),
  ]);

  const publicHandles = allHandles.filter((h) => h.isPubliclyDecryptable);

  return (
    <div className="min-h-screen">
      <TopNav />
      <LiveRefresh />
      <div className="flex">
        <Sidebar rlcPrice={prices?.rlc} activeKey="viewers" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/40 px-6 py-4 backdrop-blur lg:px-10">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted-2)]">Compute</div>
              <h1 className="font-display mt-1 text-[22px] font-medium tracking-tight">Public Decryption</h1>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
              <span className="pulse-dot inline-block size-1.5 rounded-full bg-[var(--color-positive)]" />
              Live · ISR 60s
            </span>
          </div>

          <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
            <p className="mb-6 max-w-2xl text-[14px] leading-[1.55] text-[var(--color-muted)]">
              Handles flagged as publicly decryptable — anyone can request the plaintext value of these encrypted outputs from the KMS.
            </p>

            <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] lg:grid-cols-3">
              {[
                { label: "Public handles", value: publicHandles.length.toLocaleString(), sub: "marked as decryptable", color: "var(--color-positive)" },
                { label: "Private handles", value: (allHandles.length - publicHandles.length).toLocaleString(), sub: "encrypted only" },
                { label: "Public rate", value: `${allHandles.length > 0 ? ((publicHandles.length / allHandles.length) * 100).toFixed(2) : 0}%`, sub: "of all handles" },
              ].map((t) => (
                <div key={t.label} className="bg-[var(--color-surface)] p-5 lg:p-6">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">{t.label}</div>
                  <div
                    className="display-num font-display mt-3 text-3xl font-medium leading-none lg:text-4xl"
                    style={t.color ? { color: t.color } : undefined}
                  >
                    {t.value}
                  </div>
                  <div className="mt-2 font-mono text-[11px] text-[var(--color-muted)]">{t.sub}</div>
                </div>
              ))}
            </div>

            <div className="surface-solid overflow-hidden rounded-2xl">
              <div className="border-b border-[var(--color-border)] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)] sm:px-7">
                {publicHandles.length.toLocaleString()} public handles
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
                      <th className="px-5 py-3 font-mono font-normal sm:px-7">Handle ID</th>
                      <th className="px-5 py-3 font-mono font-normal sm:px-7">Chain</th>
                      <th className="px-5 py-3 font-mono font-normal sm:px-7">Operation</th>
                      <th className="px-5 py-3 font-mono font-normal sm:px-7">Time</th>
                      <th className="px-5 py-3 text-right font-mono font-normal sm:px-7">Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publicHandles.slice(0, 200).map((h) => (
                      <tr
                        key={h.id}
                        className="border-b border-[var(--color-border)]/60 transition-colors last:border-0 hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-3 font-mono text-[11px] text-[var(--color-foreground)]/70 sm:px-7">
                          {shortAddress(h.id)}
                        </td>
                        <td className="px-5 py-3 sm:px-7">
                          <ChainBadge chainId={h.chainId} />
                        </td>
                        <td className="px-5 py-3 font-mono text-[12px] font-medium text-white sm:px-7">
                          {h.operator}
                        </td>
                        <td className="px-5 py-3 font-mono text-[11px] text-[var(--color-muted)] sm:px-7">
                          {relativeTime(Number(h.blockTimestamp))}
                        </td>
                        <td className="px-5 py-3 text-right sm:px-7">
                          <a
                            href={explorerTx(h.chainId, h.transactionHash)}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[12px] text-[var(--color-muted)] hover:text-[var(--color-accent)]"
                          >
                            {shortAddress(h.transactionHash)} ↗
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
