import { AclTable, ACL_PAGE_SIZE } from "@/components/AclTable";
import { param, paginate, matchesQuery, type SearchParams } from "@/lib/table";
import { ARB_SEPOLIA_ID, ETH_SEPOLIA_ID } from "@/lib/nox";
import { PageHeader, LivePill, WarnPill } from "@/components/PageHeader";
import { StatTiles } from "@/components/StatTiles";
import { scanRoles } from "@/lib/subgraph";

export const metadata = { title: "ACL Audit" };
export const revalidate = 60;

export default async function AclPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { items: roles, complete } = await scanRoles({ pageSize: 1000, maxPages: 10 });

  const role = param(sp, "role");
  const chain = param(sp, "chain");
  const q = param(sp, "q");
  const wantChain =
    chain === "arb" ? ARB_SEPOLIA_ID : chain === "eth" ? ETH_SEPOLIA_ID : undefined;

  const visible = roles.filter((r) => {
    if (role && r.role !== role) return false;
    if (wantChain !== undefined && r.chainId !== wantChain) return false;
    return matchesQuery(q, r.account, r.grantedBy);
  });
  const paged = paginate(visible, param(sp, "page"), ACL_PAGE_SIZE);

  const admins = new Set(
    roles.filter((r) => r.role === "ADMIN").map((r) => r.account.toLowerCase()),
  );
  const viewers = new Set(
    roles.filter((r) => r.role === "VIEWER").map((r) => r.account.toLowerCase()),
  );

  return (
    <>
      <PageHeader kicker="Compute" title="ACL Audit">
        {complete ? <LivePill /> : <WarnPill label="Truncated · scan cap reached" />}
      </PageHeader>

      <main id="content" className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
        <p className="mb-6 max-w-2xl text-[14px] leading-[1.55] text-[var(--color-muted)]">
          All on-chain access control grants — every address that has been given ADMIN or
          VIEWER rights over confidential handles.
        </p>

        <div className="mb-8">
          <StatTiles
            stats={[
              {
                label: "Total grants",
                value: `${complete ? "" : "\u2265"}${roles.length.toLocaleString()}`,
                sub: complete ? "all-time" : "scan cap reached",
              },
              {
                label: "Distinct admins",
                value: admins.size.toLocaleString(),
                sub: "unique addresses",
              },
              {
                label: "Distinct viewers",
                value: viewers.size.toLocaleString(),
                sub: "unique addresses",
              },
              {
                label: "Total grantors",
                value: new Set(
                  roles.map((r) => r.grantedBy.toLowerCase()),
                ).size.toLocaleString(),
                sub: "addresses that granted",
              },
            ]}
          />
        </div>

        <AclTable
          pathname="/acl"
          searchParams={sp}
          rows={paged.rows}
          page={paged.page}
          totalPages={paged.totalPages}
          filtered={paged.filtered}
          total={roles.length}
          from={paged.from}
          to={paged.to}
        />
      </main>
    </>
  );
}
