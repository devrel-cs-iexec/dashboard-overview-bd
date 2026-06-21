import { TopNav } from "@/components/TopNav";
import { LiveRefresh } from "@/components/LiveRefresh";
import { HeroLanding } from "@/components/HeroLanding";
import { SidebarGuide } from "@/components/SidebarGuide";
import { RecentActivityLight } from "@/components/RecentActivityLight";
import { FooterDark } from "@/components/FooterDark";
import { getMeta } from "@/lib/subgraph";

export const revalidate = 60;

export default async function Page() {
  const meta = await getMeta().catch(() => null);
  return (
    <main className="relative flex min-h-screen flex-col">
      <TopNav variant="transparent" />
      <LiveRefresh />
      <HeroLanding subgraphBlock={meta?.block.number} />
      <SidebarGuide />
      <RecentActivityLight />
      <FooterDark />
    </main>
  );
}
