import { AclTable } from "@/components/AclTable";
import { PageHeader, LivePill } from "@/components/PageHeader";
import { StatTiles } from "@/components/StatTiles";
import { scanRoles } from "@/lib/subgraph";

export const metadata = { title: "ACL Audit" };
export const revalidate = 60;

export default async function AclPage() {
  const roles = await scanRoles({ pageSize: 1000, maxPages: 10 });

  const admins = new Set(roles.filter((r) => r.role === "ADMIN").map((r) => r.account.toLowerCase()));
  const viewers = new Set(roles.filter((r) => r.role === "VIEWER").map((r) => r.account.toLowerCase()));

  return (
    <>
      <PageHeader kicker="Compute" title="ACL Audit">
        <LivePill />
      </PageHeader>

      <main id="content" className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
        <p className="mb-6 max-w-2xl text-[14px] leading-[1.55] text-[var(--color-muted)]">
          All on-chain access control grants — every address that has been given ADMIN or VIEWER rights over confidential handles.
        </p>

        <div className="mb-8">
          <StatTiles
            stats={[
              { label: "Total grants", value: roles.length.toLocaleString(), sub: "all-time" },
              { label: "Distinct admins", value: admins.size.toLocaleString(), sub: "unique addresses" },
              { label: "Distinct viewers", value: viewers.size.toLocaleString(), sub: "unique addresses" },
              { label: "Total grantors", value: new Set(roles.map((r) => r.grantedBy.toLowerCase())).size.toLocaleString(), sub: "addresses that granted" },
            ]}
          />
        </div>

        <AclTable rows={roles} />
      </main>
    </>
  );
}
