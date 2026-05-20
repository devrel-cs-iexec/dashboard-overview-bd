import Link from "next/link";
import { Reveal } from "./Reveal";

export function HeroLanding({
  subgraphBlock,
}: {
  subgraphBlock?: number;
}) {
  return (
    <section className="hero-dark relative isolate overflow-hidden">
      <div className="bg-grid absolute inset-0 opacity-60" />
      <div className="relative mx-auto w-full max-w-7xl px-6 pt-16 pb-24 lg:px-10 lg:pt-24 lg:pb-32">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-white/80 backdrop-blur">
            <span className="size-1.5 rounded-full bg-[var(--color-accent)]" />
            <span className="font-mono uppercase tracking-[0.18em]">
              {subgraphBlock
                ? `Live · subgraph block #${subgraphBlock.toLocaleString()}`
                : "Live · Arbitrum Sepolia"}
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 className="font-display mt-6 max-w-4xl text-[40px] font-medium leading-[1.05] tracking-[-0.03em] text-white sm:text-[56px] lg:text-[72px]">
            Live protocol activity{" "}
            <span className="text-[var(--color-lavender-soft)]">— then dive</span>
            <br className="hidden sm:block" />
            into every tool.
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-6 max-w-2xl text-[17px] leading-[1.55] text-white/70">
            Follow live on-chain activity across the Nox protocol in one feed.
            Open the dashboard for TVS, charts, and every module in the sidebar.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/tvs" className="btn-yellow inline-flex items-center gap-2">
              Open Dashboard
              <span aria-hidden>→</span>
            </Link>
            <a
              href="https://docs.iex.ec"
              target="_blank"
              rel="noreferrer"
              className="btn-outline-dark inline-flex items-center gap-2"
            >
              About Nox
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
