import { TopNav } from "@/components/TopNav";
import { Sidebar } from "@/components/Sidebar";
import { getHandlesByTx } from "@/lib/subgraph";
import { getPrices } from "@/lib/price";
import { opCategory } from "@/lib/nox";
import { relativeTime, shortAddress, explorerTx } from "@/lib/format";
import { ChainBadge } from "@/components/ChainBadge";

export const revalidate = 0;

const CAT_COLOR: Record<string, string> = {
  arithmetic: "var(--color-accent)",
  comparison: "#a78bfa",
  token: "var(--color-positive)",
  control: "#fb923c",
  acl: "#38bdf8",
  other: "var(--color-muted)",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const prices = await getPrices().catch(() => null);
  const query = q?.trim();

  let handles: Awaited<ReturnType<typeof getHandlesByTx>> = [];
  let error: string | null = null;

  if (query) {
    if (query.startsWith("0x") && query.length === 66) {
      handles = await getHandlesByTx(query).catch(() => []);
    } else if (query.startsWith("0x") && query.length === 42) {
      // Address — redirect to address profile
    } else {
      error = "Enter a valid tx hash (0x… 66 chars) or address (0x… 42 chars).";
    }
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="flex">
        <Sidebar rlcPrice={prices?.rlc} activeKey="search" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/40 px-6 py-4 backdrop-blur lg:px-10">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted-2)]">Search</div>
            <h1 className="font-display mt-1 text-[22px] font-medium tracking-tight">Advanced Search</h1>
          </div>

          <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
            <p className="mb-6 max-w-2xl text-[14px] leading-[1.55] text-[var(--color-muted)]">
              Search compute operations by transaction hash to see every handle created in a single tx. Or enter an address to go to the Address Profile.
            </p>

            <form method="get" className="mb-8 flex gap-2">
              <input
                type="text"
                name="q"
                defaultValue={query ?? ""}
                placeholder="0x… tx hash or address"
                className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-4 py-3 font-mono text-[14px] text-white placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-accent)] focus:outline-none"
              />
              <button type="submit" className="btn-yellow rounded-xl px-6 py-3 font-mono text-[13px]">
                Search
              </button>
            </form>

            {error && (
              <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-mono text-[13px] text-amber-300">
                {error}
              </div>
            )}

            {query && !error && handles.length === 0 && (
              <div className="surface-solid rounded-2xl px-8 py-16 text-center text-[var(--color-muted)]">
                No handles found for this transaction.
              </div>
            )}

            {handles.length > 0 && (
              <div className="surface-solid overflow-hidden rounded-2xl">
                <div className="border-b border-[var(--color-border)] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)] sm:px-7">
                  {handles.length} handle{handles.length !== 1 ? "s" : ""} in tx{" "}
                  <a
                    href={explorerTx(handles[0]?.chainId ?? 421614, query!)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    {shortAddress(query!)} ↗
                  </a>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
                      <th className="px-5 py-3 font-mono font-normal sm:px-7">Handle ID</th>
                      <th className="px-5 py-3 font-mono font-normal sm:px-7">Chain</th>
                      <th className="px-5 py-3 font-mono font-normal sm:px-7">Operation</th>
                      <th className="px-5 py-3 font-mono font-normal sm:px-7">Category</th>
                      <th className="px-5 py-3 font-mono font-normal sm:px-7">Public</th>
                      <th className="px-5 py-3 text-right font-mono font-normal sm:px-7">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {handles.map((h) => {
                      const cat = opCategory(h.operator);
                      return (
                        <tr key={h.id} className="border-b border-[var(--color-border)]/60 last:border-0 hover:bg-white/[0.02]">
                          <td className="px-5 py-3 font-mono text-[11px] text-[var(--color-foreground)]/60 sm:px-7">
                            {shortAddress(h.id)}
                          </td>
                          <td className="px-5 py-3 sm:px-7">
                            <ChainBadge chainId={h.chainId} />
                          </td>
                          <td className="px-5 py-3 font-mono text-[12px] font-medium text-white sm:px-7">
                            {h.operator}
                          </td>
                          <td className="px-5 py-3 sm:px-7">
                            <span
                              className="inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]"
                              style={{ color: CAT_COLOR[cat], borderColor: `${CAT_COLOR[cat]}40`, backgroundColor: `${CAT_COLOR[cat]}12` }}
                            >
                              {cat}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-mono text-[11px] sm:px-7">
                            {h.isPubliclyDecryptable ? (
                              <span className="text-[var(--color-positive)]">Yes</span>
                            ) : (
                              <span className="text-[var(--color-muted-2)]">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-[11px] text-[var(--color-muted)] sm:px-7">
                            {relativeTime(Number(h.blockTimestamp))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!query && (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="surface-solid rounded-xl p-5">
                  <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]">Tx hash lookup</div>
                  <p className="text-[13px] text-[var(--color-muted)]">Paste a 0x… transaction hash to see every handle created in that transaction — the operation type, whether it&apos;s public, and when it happened.</p>
                </div>
                <div className="surface-solid rounded-xl p-5">
                  <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#38bdf8]">Address profile</div>
                  <p className="text-[13px] text-[var(--color-muted)]">Paste a 0x… wallet address to jump to the <a href="/address" className="text-[#38bdf8] hover:underline">Address Profile</a> — ACL grants and shield/unshield history for that wallet.</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
