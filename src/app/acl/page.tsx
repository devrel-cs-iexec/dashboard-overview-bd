import { TopNav } from "@/components/TopNav";
import { LiveRefresh } from "@/components/LiveRefresh";
import { Sidebar } from "@/components/Sidebar";
import { AclTable } from "@/components/AclTable";
import { scanRoles } from "@/lib/subgraph";
import { getPrices } from "@/lib/price";

export const revalidate = 60;

export default async function AclPage() {
  const [roles, prices] = await Promise.all([
    scanRoles({ pageSize: 1000, maxPages: 10 }),
    getPrices().catch(() => null),
  ]);

  const admins = new Set(roles.filter((r) => r.role === "ADMIN").map((r) => r.account.toLowerCase()));
  const viewers = new Set(roles.filter((r) => r.role === "VIEWER").map((r) => r.account.toLowerCase()));

  return (
    <div className="min-h-screen">
      <TopNav showOpenDashboard={false} />
      <LiveRefresh />
      <div className="flex">
        <Sidebar rlcPrice={prices?.rlc} activeKey="acl" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/40 px-6 py-4 backdrop-blur lg:px-10">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted-2)]">Compute</div>
              <h1 className="font-display mt-1 text-[22px] font-medium tracking-tight">ACL Audit</h1>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
              <span className="pulse-dot inline-block size-1.5 rounded-full bg-[var(--color-positive)]" />
              Live · ISR 60s
            </span>
          </div>

          <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
            <p className="mb-6 max-w-2xl text-[14px] leading-[1.55] text-[var(--color-muted)]">
              All on-chain access control grants — every address that has been given ADMIN or VIEWER rights over confidential handles.
            </p>

            <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] lg:grid-cols-4">
              {[
                { label: "Total grants", value: roles.length.toLocaleString(), sub: "all-time" },
                { label: "Distinct admins", value: admins.size.toLocaleString(), sub: "unique addresses" },
                { label: "Distinct viewers", value: viewers.size.toLocaleString(), sub: "unique addresses" },
                { label: "Total grantors", value: new Set(roles.map((r) => r.grantedBy.toLowerCase())).size.toLocaleString(), sub: "addresses that granted" },
              ].map((t) => (
                <div key={t.label} className="bg-[var(--color-surface)] p-5 lg:p-6">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">{t.label}</div>
                  <div className="display-num font-display mt-3 text-3xl font-medium leading-none lg:text-4xl">{t.value}</div>
                  <div className="mt-2 font-mono text-[11px] text-[var(--color-muted)]">{t.sub}</div>
                </div>
              ))}
            </div>

            <AclTable rows={roles} />
          </main>
        </div>
      </div>
    </div>
  );
}
