import { TopNav } from "@/components/TopNav";
import { Sidebar } from "@/components/Sidebar";
import { scanRolesByAddress } from "@/lib/subgraph";
import { loadTvsEvents } from "@/lib/tvs";
import { getPrices } from "@/lib/price";
import { relativeTime, shortAddress, formatTokenAmount, formatUsd, explorerTx, explorerAddress } from "@/lib/format";
import { ChainBadge } from "@/components/ChainBadge";

export const revalidate = 0;

export default async function AddressPage({
  searchParams,
}: {
  searchParams: Promise<{ addr?: string }>;
}) {
  const { addr } = await searchParams;
  const prices = await getPrices().catch(() => null);
  const address = addr?.trim().toLowerCase();

  let roles: Awaited<ReturnType<typeof scanRolesByAddress>> = [];
  let tvsEvents: Awaited<ReturnType<typeof loadTvsEvents>>["events"] = [];

  if (address) {
    const [rolesResult, tvsPayload] = await Promise.all([
      scanRolesByAddress(address),
      loadTvsEvents(),
    ]);
    roles = rolesResult;
    tvsEvents = tvsPayload.events.filter(
      (e) => e.account.toLowerCase() === address,
    );
  }

  return (
    <div className="min-h-screen">
      <TopNav showOpenDashboard={false} />
      <div className="flex">
        <Sidebar rlcPrice={prices?.rlc} activeKey="address" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/40 px-6 py-4 backdrop-blur lg:px-10">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted-2)]">Dashboards</div>
            <h1 className="font-display mt-1 text-[22px] font-medium tracking-tight">Address Profile</h1>
          </div>

          <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
            <form method="get" className="mb-8 flex gap-2">
              <input
                type="text"
                name="addr"
                defaultValue={addr ?? ""}
                placeholder="0x… wallet or contract address"
                className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-4 py-3 font-mono text-[14px] text-white placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-accent)] focus:outline-none"
              />
              <button
                type="submit"
                className="btn-yellow rounded-xl px-6 py-3 font-mono text-[13px]"
              >
                Lookup
              </button>
            </form>

            {address ? (
              <div className="space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] lg:grid-cols-3">
                  {[
                    { label: "ACL grants", value: roles.length.toLocaleString() },
                    { label: "Shield/Unshield events", value: tvsEvents.length.toLocaleString() },
                    { label: "TVS USD volume", value: formatUsd(tvsEvents.reduce((s, e) => s + e.amountUsd, 0)) },
                  ].map((t) => (
                    <div key={t.label} className="bg-[var(--color-surface)] p-5 lg:p-6">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">{t.label}</div>
                      <div className="display-num font-display mt-3 text-2xl font-medium leading-none">{t.value}</div>
                    </div>
                  ))}
                </div>

                {/* ACL grants */}
                {roles.length > 0 && (
                  <div className="surface-solid overflow-hidden rounded-2xl">
                    <div className="border-b border-[var(--color-border)] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)] sm:px-7">
                      ACL grants · {roles.length}
                    </div>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[var(--color-border)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
                          <th className="px-5 py-3 font-mono font-normal sm:px-7">Account</th>
                          <th className="px-5 py-3 font-mono font-normal sm:px-7">Chain</th>
                          <th className="px-5 py-3 font-mono font-normal sm:px-7">Role</th>
                          <th className="px-5 py-3 font-mono font-normal sm:px-7">Granted By</th>
                          <th className="px-5 py-3 text-right font-mono font-normal sm:px-7">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roles.map((r) => (
                          <tr key={r.id} className="border-b border-[var(--color-border)]/60 last:border-0 hover:bg-white/[0.02]">
                            <td className="px-5 py-3 font-mono text-[12px] sm:px-7">
                              <a href={explorerAddress(r.chainId, r.account)} target="_blank" rel="noreferrer" className="text-[var(--color-foreground)]/85 hover:text-[var(--color-accent)]">{shortAddress(r.account)}</a>
                            </td>
                            <td className="px-5 py-3 sm:px-7">
                              <ChainBadge chainId={r.chainId} />
                            </td>
                            <td className="px-5 py-3 sm:px-7">
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${r.role === "ADMIN" ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-[#38bdf8]/30 bg-[#38bdf8]/10 text-[#38bdf8]"}`}>
                                {r.role}
                              </span>
                            </td>
                            <td className="px-5 py-3 font-mono text-[12px] text-[var(--color-muted)] sm:px-7">
                              <a href={`/address?addr=${r.grantedBy}`} className="hover:text-[var(--color-accent)]">{shortAddress(r.grantedBy)}</a>
                            </td>
                            <td className="px-5 py-3 text-right font-mono text-[11px] text-[var(--color-muted)] sm:px-7">
                              {relativeTime(Number(r.blockTimestamp))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TVS events */}
                {tvsEvents.length > 0 && (
                  <div className="surface-solid overflow-hidden rounded-2xl">
                    <div className="border-b border-[var(--color-border)] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)] sm:px-7">
                      Shield / Unshield events · {tvsEvents.length}
                    </div>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[var(--color-border)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
                          <th className="px-5 py-3 font-mono font-normal sm:px-7">Direction</th>
                          <th className="px-5 py-3 font-mono font-normal sm:px-7">Chain</th>
                          <th className="px-5 py-3 font-mono font-normal sm:px-7">Amount</th>
                          <th className="px-5 py-3 font-mono font-normal sm:px-7">Token</th>
                          <th className="px-5 py-3 font-mono font-normal sm:px-7">Time</th>
                          <th className="px-5 py-3 text-right font-mono font-normal sm:px-7">Tx</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tvsEvents.map((e) => (
                          <tr key={e.id} className="border-b border-[var(--color-border)]/60 last:border-0 hover:bg-white/[0.02]">
                            <td className="px-5 py-3 sm:px-7">
                              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${e.direction === "shield" ? "border-[var(--color-positive)]/30 bg-[var(--color-positive)]/10 text-[var(--color-positive)]" : "border-[var(--color-negative)]/30 bg-[var(--color-negative)]/10 text-[var(--color-negative)]"}`}>
                                {e.direction}
                              </span>
                            </td>
                            <td className="px-5 py-3 sm:px-7">
                              <ChainBadge chainId={e.chainId} />
                            </td>
                            <td className="px-5 py-3 font-mono text-[12px] sm:px-7">
                              <div>{formatTokenAmount(e.amount, e.decimals, 2)} {e.symbol}</div>
                              <div className="text-[11px] text-[var(--color-muted)]">{formatUsd(e.amountUsd)}</div>
                            </td>
                            <td className="px-5 py-3 font-mono text-[12px] text-[var(--color-muted)] sm:px-7">{e.symbol}</td>
                            <td className="px-5 py-3 font-mono text-[11px] text-[var(--color-muted)] sm:px-7">
                              {e.timestamp ? relativeTime(e.timestamp) : "—"}
                            </td>
                            <td className="px-5 py-3 text-right sm:px-7">
                              <a href={explorerTx(e.chainId, e.transactionHash)} target="_blank" rel="noreferrer" className="font-mono text-[12px] text-[var(--color-muted)] hover:text-[var(--color-accent)]">
                                {shortAddress(e.transactionHash)} ↗
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {roles.length === 0 && tvsEvents.length === 0 && (
                  <div className="surface-solid rounded-2xl px-8 py-16 text-center text-[var(--color-muted)]">
                    No data found for <span className="font-mono text-white">{address}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="surface-solid rounded-2xl px-8 py-16 text-center text-[var(--color-muted)]">
                Enter an address above to view its full activity profile.
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
