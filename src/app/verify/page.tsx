import { PageHeader } from "@/components/PageHeader";
import { SearchForm } from "@/components/SearchForm";
import { getHandleById } from "@/lib/subgraph";
import { opCategory, CAT_COLOR } from "@/lib/nox";
import { relativeTime, shortAddress, explorerTx } from "@/lib/format";

export const metadata = { title: "Input Verification" };
export const revalidate = 0;

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const handleId = id?.trim();

  let handle: Awaited<ReturnType<typeof getHandleById>> = null;
  let searched = false;

  if (handleId && handleId.startsWith("0x") && handleId.length === 66) {
    searched = true;
    handle = await getHandleById(handleId).catch(() => null);
  }

  return (
    <>
      <PageHeader kicker="Search" title="Input Verification" />

      <main id="content" className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
        <p className="mb-6 max-w-2xl text-[14px] leading-[1.55] text-[var(--color-muted)]">
          Verify that a given handle exists on-chain. Paste the bytes32 handle ID to confirm its operation type, timestamp, and public decryptability status.
        </p>

        <SearchForm
          name="id"
          label="Handle ID (bytes32)"
          placeholder="0x… handle ID (bytes32, 66 chars)"
          defaultValue={handleId}
          submitLabel="Verify"
        />

            {handleId && (!handleId.startsWith("0x") || handleId.length !== 66) && (
              <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-mono text-[13px] text-amber-300">
                Invalid format. Handle IDs are 0x-prefixed bytes32 (66 characters total).
              </div>
            )}

            {searched && !handle && (
              <div className="surface-solid rounded-2xl px-8 py-16 text-center">
                <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-negative)]">Not found</div>
                <p className="text-[14px] text-[var(--color-muted)]">
                  Handle <span className="font-mono text-white">{shortAddress(handleId!)}</span> does not exist in the Ponder index.
                </p>
              </div>
            )}

            {handle && (() => {
              const cat = opCategory(handle.operator);
              return (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-positive)]/30 bg-[var(--color-positive)]/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-positive)]">
                      <span className="size-1.5 rounded-full bg-current" />
                      Verified on-chain
                    </span>
                    {handle.isPubliclyDecryptable && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#38bdf8]/30 bg-[#38bdf8]/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#38bdf8]">
                        Publicly decryptable
                      </span>
                    )}
                  </div>

                  <div className="surface-solid overflow-hidden rounded-2xl">
                    {[
                      { label: "Handle ID", value: handle.id },
                      { label: "Chain", value: handle.chainId === 421614 ? "Arbitrum Sepolia" : "Ethereum Sepolia" },
                      { label: "Operation", value: handle.operator },
                      { label: "Category", value: cat },
                      { label: "Publicly decryptable", value: handle.isPubliclyDecryptable ? "Yes — anyone can request plaintext" : "No — encrypted only" },
                      { label: "Block timestamp", value: `${handle.blockTimestamp} (${relativeTime(Number(handle.blockTimestamp))})` },
                      { label: "Transaction", value: handle.transactionHash },
                    ].map(({ label, value }) => (
                      <div key={label} className="grid grid-cols-[200px_1fr] border-b border-[var(--color-border)] px-6 py-4 last:border-0">
                        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-muted-2)]">{label}</div>
                        <div className="font-mono text-[13px] text-white">
                          {label === "Category" ? (
                            <span
                              className="inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]"
                              style={{ color: CAT_COLOR[cat], borderColor: `${CAT_COLOR[cat]}40`, backgroundColor: `${CAT_COLOR[cat]}12` }}
                            >
                              {value}
                            </span>
                          ) : label === "Transaction" ? (
                            <a
                              href={explorerTx(handle.chainId, value)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[var(--color-accent)] hover:underline"
                            >
                              {value} ↗
                            </a>
                          ) : (
                            <span className="break-all">{value}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {!handleId && (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="surface-solid rounded-xl p-5">
                  <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]">What is a handle?</div>
                  <p className="text-[13px] text-[var(--color-muted)]">
                    Every encrypted value in Nox is represented as a bytes32 handle — a unique identifier pointing to an encrypted ciphertext managed by the coprocessor.
                  </p>
                </div>
                <div className="surface-solid rounded-xl p-5">
                  <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#a78bfa]">Verification confirms</div>
                  <ul className="mt-2 space-y-1 text-[13px] text-[var(--color-muted)]">
                    <li>· The handle exists in the Ponder index</li>
                    <li>· Which operation produced it</li>
                    <li>· Whether anyone can decrypt it publicly</li>
                    <li>· The transaction and block it appeared in</li>
                  </ul>
                </div>
              </div>
            )}
      </main>
    </>
  );
}
