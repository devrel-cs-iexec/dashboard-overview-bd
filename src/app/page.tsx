import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { TokensSection } from "@/components/TokensSection";
import { OpsSection } from "@/components/OpsSection";
import { ActivitySection } from "@/components/ActivitySection";
import { Footer } from "@/components/Footer";
import { loadDashboard } from "@/lib/data";

export const revalidate = 30;

export default async function Page() {
  const data = await loadDashboard();
  return (
    <main className="relative flex min-h-screen flex-col">
      <Header lagSeconds={data.meta.lagSeconds} />
      <Hero data={data} />
      <TokensSection tokens={data.tokens} />
      <OpsSection data={data} />
      <ActivitySection data={data} />
      <Footer />
    </main>
  );
}
