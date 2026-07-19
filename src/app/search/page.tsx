import { PageHeader } from "@/components/PageHeader";
import { SearchForm } from "@/components/SearchForm";
import { getHandlesByTx } from "@/lib/subgraph";
import { opCategory, CAT_COLOR } from "@/lib/nox";
import { relativeTime, shortAddress, explorerTx } from "@/lib/format";
import { ChainBadge } from "@/components/ChainBadge";

export const metadata = { title: "Advanced Search" };
export const revalidate = 0;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
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
    <>
      <PageHeader kicker="Search" title="Advanced Search" />

      <main id="content" className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
        <p className="mb-6 max-w-2xl text-[14px] leading-[1.55] text-[var(--color-muted)]">
          Search compute operations by transaction hash to see every handle created in a
          single tx. Or enter an address to go to the Address Profile.
        </p>

        <SearchForm
          name="q"
          label="Transaction hash or address"
          placeholder="0x… tx hash or address"
          defaultValue={query}
        />

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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
                    <th scope="col" className="px-5 py-3 font-mono font-normal sm:px-7">
                      Handle ID
                    </th>
                    <th scope="col" className="px-5 py-3 font-mono font-normal sm:px-7">
                      Chain
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
                      Time
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
                        <td className="px-5 py-3 sm:px-7">
                          <ChainBadge chainId={h.chainId} />
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
                        <td className="px-5 py-3 text-right font-mono text-[11px] text-[var(--color-muted)] sm:px-7">
                          {relativeTime(Number(h.blockTimestamp))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!query && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="surface-solid rounded-xl p-5">
              <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
                Tx hash lookup
              </div>
              <p className="text-[13px] text-[var(--color-muted)]">
                Paste a 0x… transaction hash to see every handle created in that
                transaction — the operation type, whether it&apos;s public, and when it
                happened.
              </p>
            </div>
            <div className="surface-solid rounded-xl p-5">
              <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#38bdf8]">
                Address profile
              </div>
              <p className="text-[13px] text-[var(--color-muted)]">
                Paste a 0x… wallet address to jump to the{" "}
                <a href="/address" className="text-[#38bdf8] hover:underline">
                  Address Profile
                </a>{" "}
                — ACL grants and shield/unshield history for that wallet.
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
