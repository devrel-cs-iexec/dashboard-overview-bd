import { PageHeader, LivePill, WarnPill } from "@/components/PageHeader";
import { StatTiles } from "@/components/StatTiles";
import { scanHandles } from "@/lib/subgraph";
import { relativeTime, shortAddress, explorerTx } from "@/lib/format";
import { ChainBadge } from "@/components/ChainBadge";

export const metadata = { title: "Public Decryption" };
export const revalidate = 60;

export default async function ViewersPage() {
  const { items: allHandles, complete } = await scanHandles({
    pageSize: 1000,
    maxPages: 12,
  });

  const publicHandles = allHandles.filter((h) => h.isPubliclyDecryptable);

  return (
    <>
      <PageHeader kicker="Compute" title="Public Decryption">
        {complete ? <LivePill /> : <WarnPill label="Truncated · scan cap reached" />}
      </PageHeader>

      <main id="content" className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
        <p className="mb-6 max-w-2xl text-[14px] leading-[1.55] text-[var(--color-muted)]">
          Handles flagged as publicly decryptable — anyone can request the plaintext value
          of these encrypted outputs from the KMS.
        </p>

        <div className="mb-8">
          <StatTiles
            columns={3}
            stats={[
              {
                label: "Public handles",
                value: publicHandles.length.toLocaleString(),
                sub: "marked as decryptable",
                color: "var(--color-positive)",
              },
              {
                label: "Private handles",
                value: (allHandles.length - publicHandles.length).toLocaleString(),
                sub: "encrypted only",
              },
              {
                label: "Public rate",
                value: `${allHandles.length > 0 ? ((publicHandles.length / allHandles.length) * 100).toFixed(2) : 0}%`,
                sub: "of all handles",
              },
            ]}
          />
        </div>

        <div className="surface-solid overflow-hidden rounded-2xl">
          <div className="border-b border-[var(--color-border)] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)] sm:px-7">
            {publicHandles.length.toLocaleString()} public handles
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
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
                    Time
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
    </>
  );
}
