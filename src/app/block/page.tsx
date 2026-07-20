import { ExplorerLink } from "@/components/ExplorerLink";
import { PageHeader } from "@/components/PageHeader";
import { getHandlesByBlock } from "@/lib/subgraph";
import { publicClient, ethSepoliaClient } from "@/lib/viem";
import { opCategory, CAT_COLOR, ARB_SEPOLIA_ID, ETH_SEPOLIA_ID } from "@/lib/nox";
import { explorerBlock, shortAddress } from "@/lib/format";

export const metadata = { title: "Block Inspector" };
export const revalidate = 0;

export default async function BlockPage({
  searchParams,
}: {
  searchParams: Promise<{ n?: string; chain?: string }>;
}) {
  const { n, chain: chainParam } = await searchParams;
  const blockNum = n ? parseInt(n, 10) : null;
  const isEth = chainParam === "eth";
  const chainId = isEth ? ETH_SEPOLIA_ID : ARB_SEPOLIA_ID;
  const rpcClient = isEth ? ethSepoliaClient : publicClient;

  let handles: Awaited<ReturnType<typeof getHandlesByBlock>> = [];
  let blockTs: number | null = null;
  let error: string | null = null;

  if (blockNum !== null && !isNaN(blockNum) && blockNum > 0) {
    try {
      const block = await rpcClient.getBlock({
        blockNumber: BigInt(blockNum),
        includeTransactions: false,
      });
      blockTs = Number(block.timestamp);
      handles = await getHandlesByBlock(blockNum, chainId);
    } catch {
      error = `Block #${blockNum} not found on ${isEth ? "ETH" : "ARB"} Sepolia or RPC error.`;
    }
  }

  return (
    <>
      <PageHeader kicker="Search" title="Block Inspector" />

      <main id="content" className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
        <p className="mb-6 max-w-2xl text-[14px] leading-[1.55] text-[var(--color-muted)]">
          Enter a block number to see all handles produced in that block.
        </p>

        <div className="mb-4 flex gap-2">
          {(["arb", "eth"] as const).map((c) => {
            const active = (c === "eth") === isEth;
            return (
              <a
                key={c}
                href={n ? `/block?chain=${c}&n=${n}` : `/block?chain=${c}`}
                className={`rounded-xl px-4 py-2 font-mono text-[12px] uppercase tracking-[0.14em] transition-colors ${active ? (c === "eth" ? "border border-purple-500/40 bg-purple-500/15 text-purple-300" : "border border-blue-500/40 bg-blue-500/15 text-blue-300") : "border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 text-[var(--color-muted)] hover:text-white"}`}
              >
                {c === "eth" ? "ETH Sepolia" : "ARB Sepolia"}
              </a>
            );
          })}
        </div>
        <form method="get" className="mb-8 flex flex-wrap items-center gap-2">
          <input type="hidden" name="chain" value={isEth ? "eth" : "arb"} />
          <label htmlFor="block-number" className="visually-hidden">
            Block number
          </label>
          <input
            id="block-number"
            type="number"
            name="n"
            defaultValue={n ?? ""}
            placeholder={
              isEth
                ? "ETH Sepolia block, e.g. 11000000"
                : "ARB Sepolia block, e.g. 277874590"
            }
            className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-4 py-3 font-mono text-[14px] text-white placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-accent)]"
          />
          <button
            type="submit"
            className="btn-yellow rounded-xl px-6 py-3 font-mono text-[13px]"
          >
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
            <span>
              {new Date(blockTs * 1000).toLocaleString("en-US", { timeZone: "UTC" })} UTC
            </span>
            <span className="text-[var(--color-muted-2)]">·</span>
            <span
              className={`font-mono text-[10px] uppercase tracking-[0.12em] ${isEth ? "text-purple-400" : "text-blue-400"}`}
            >
              {isEth ? "ETH" : "ARB"} Sepolia
            </span>
            <a
              href={explorerBlock(chainId, blockNum!)}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--color-accent)]"
            >
              View on {isEth ? "Etherscan" : "Arbiscan"} ↗
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
              {handles.length} handle{handles.length !== 1 ? "s" : ""} in block #
              {blockNum!.toLocaleString()}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
                    <th scope="col" className="px-5 py-3 font-mono font-normal sm:px-7">
                      Handle ID
                    </th>
                    <th scope="col" className="px-5 py-3 font-mono font-normal sm:px-7">
                      Operation
                    </th>
                    <th scope="col" className="px-5 py-3 font-mono font-normal sm:px-7">
                      Category
                    </th>
                    <th scope="col" className="px-5 py-3 font-mono font-normal sm:px-7">
                      Public
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-3 text-right font-mono font-normal sm:px-7"
                    >
                      Tx
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {handles.map((h) => {
                    const cat = opCategory(h.operator);
                    return (
                      <tr
                        key={h.id}
                        className="border-b border-[var(--color-border)]/60 last:border-0 hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-3 font-mono text-[11px] text-[var(--color-foreground)]/60 sm:px-7">
                          {shortAddress(h.id)}
                        </td>
                        <td className="px-5 py-3 font-mono text-[12px] font-medium text-white sm:px-7">
                          {h.operator}
                        </td>
                        <td className="px-5 py-3 sm:px-7">
                          <span
                            className="inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]"
                            style={{
                              color: CAT_COLOR[cat],
                              borderColor: `${CAT_COLOR[cat]}40`,
                              backgroundColor: `${CAT_COLOR[cat]}12`,
                            }}
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
                          <ExplorerLink
                            chainId={h.chainId}
                            kind="tx"
                            value={h.transactionHash}
                            className="font-mono text-[12px] text-[var(--color-muted)] hover:text-[var(--color-accent)]"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!blockNum && (
          <div className="surface-solid rounded-xl p-6">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
              How it works
            </div>
            <p className="text-[13px] text-[var(--color-muted)]">
              Select a chain (ARB or ETH Sepolia), then enter a block number. The
              inspector fetches the block timestamp via RPC, then queries the Ponder
              indexer for all handles produced in that timestamp window on that chain.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
