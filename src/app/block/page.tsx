import { TopNav } from "@/components/TopNav";
import { Sidebar } from "@/components/Sidebar";
import { getHandlesByTimestampRange } from "@/lib/subgraph";
import { getPrices } from "@/lib/price";
import { publicClient } from "@/lib/viem";
import { opCategory } from "@/lib/nox";
import { relativeTime, shortAddress } from "@/lib/format";

export const revalidate = 0;

const CAT_COLOR: Record<string, string> = {
  arithmetic: "var(--color-accent)",
  comparison: "#a78bfa",
  token: "var(--color-positive)",
  control: "#fb923c",
  acl: "#38bdf8",
  other: "var(--color-muted)",
};

export default async function BlockPage({
  searchParams,
}: {
  searchParams: Promise<{ n?: string }>;
}) {
  const { n } = await searchParams;
  const prices = await getPrices().catch(() => null);
  const blockNum = n ? parseInt(n, 10) : null;

  let handles: Awaited<ReturnType<typeof getHandlesByTimestampRange>> = [];
  let blockTs: number | null = null;
  let error: string | null = null;

  if (blockNum !== null && !isNaN(blockNum) && blockNum > 0) {
    try {
      const block = await publicClient.getBlock({ blockNumber: BigInt(blockNum), includeTransactions: false });
      blockTs = Number(block.timestamp);
      handles = await getHandlesByTimestampRange(blockTs - 1, blockTs + 15, 500);
    } catch {
      error = `Block #${blockNum} not found or RPC error.`;
    }
  }

  return (
    <div className="min-h-screen">
      <TopNav showOpenDashboard={false} />
      <div className="flex">
        <Sidebar rlcPrice={prices?.rlc} activeKey="block" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/40 px-6 py-4 backdrop-blur lg:px-10">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted-2)]">Search</div>
            <h1 className="font-display mt-1 text-[22px] font-medium tracking-tight">Block Inspector</h1>
          </div>

          <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
            <p className="mb-6 max-w-2xl text-[14px] leading-[1.55] text-[var(--color-muted)]">
              Enter a block number to see all handles produced in that block.
            </p>

            <form method="get" className="mb-8 flex gap-2">
              <input
                type="number"
                name="n"
                defaultValue={n ?? ""}
                placeholder="Block number, e.g. 277874590"
                className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-4 py-3 font-mono text-[14px] text-white placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-accent)] focus:outline-none"
              />
              <button type="submit" className="btn-yellow rounded-xl px-6 py-3 font-mono text-[13px]">
                Inspect
              </button>
            </form>

            {error && (
              <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-mono text-[13px] text-amber-300">
                {error}
              </div>
            )}

            {blockTs && (
              <div className="mb-4 flex items-center gap-4 font-mono text-[12px] text-[var(--color-muted)]">
                <span>Block #{blockNum!.toLocaleString()}</span>
                <span className="text-[var(--color-muted-2)]">·</span>
                <span>{new Date(blockTs * 1000).toLocaleString("en-US", { timeZone: "UTC" })} UTC</span>
                <a
                  href={`https://sepolia.arbiscan.io/block/${blockNum}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--color-accent)]"
                >
                  View on Arbiscan ↗
                </a>
              </div>
            )}

            {blockNum !== null && !error && handles.length === 0 && blockTs && (
              <div className="surface-solid rounded-2xl px-8 py-16 text-center text-[var(--color-muted)]">
                No handles found in block #{blockNum.toLocaleString()}.
              </div>
            )}

            {handles.length > 0 && (
              <div className="surface-solid overflow-hidden rounded-2xl">
                <div className="border-b border-[var(--color-border)] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)] sm:px-7">
                  {handles.length} handle{handles.length !== 1 ? "s" : ""} in block #{blockNum!.toLocaleString()}
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
                      <th className="px-5 py-3 font-mono font-normal sm:px-7">Handle ID</th>
                      <th className="px-5 py-3 font-mono font-normal sm:px-7">Operation</th>
                      <th className="px-5 py-3 font-mono font-normal sm:px-7">Category</th>
                      <th className="px-5 py-3 font-mono font-normal sm:px-7">Public</th>
                      <th className="px-5 py-3 text-right font-mono font-normal sm:px-7">Tx</th>
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
                          <td className="px-5 py-3 text-right sm:px-7">
                            <a href={`https://sepolia.arbiscan.io/tx/${h.transactionHash}`} target="_blank" rel="noreferrer" className="font-mono text-[12px] text-[var(--color-muted)] hover:text-[var(--color-accent)]">
                              {shortAddress(h.transactionHash)} ↗
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!blockNum && (
              <div className="surface-solid rounded-xl p-6">
                <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]">How it works</div>
                <p className="text-[13px] text-[var(--color-muted)]">
                  Enter any Arbitrum Sepolia block number. The inspector fetches the block timestamp via RPC, then queries the Nox indexer for all handles produced in that timestamp window.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
