import Link from "next/link";
import { Reveal } from "./Reveal";

export function HeroLanding({
  subgraphBlock,
}: {
  subgraphBlock?: number;
}) {
  return (
    <section className="hero-dark relative isolate overflow-hidden">
      <div className="bg-grid absolute inset-0 opacity-50" />
      <div className="relative mx-auto w-full max-w-6xl px-6 pt-20 pb-28 lg:px-10 lg:pt-28 lg:pb-36">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[12px] text-white/75 backdrop-blur">
            <span className="size-1.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_12px_rgba(252,209,90,0.6)]" />
            <span className="font-mono uppercase tracking-[0.18em]">
              {subgraphBlock
                ? `Live · block #${subgraphBlock.toLocaleString()}`
                : "Live · ARB + ETH Sepolia"}
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 className="font-display mt-7 max-w-3xl text-[40px] font-medium leading-[1.05] tracking-[-0.03em] text-white sm:text-[56px] lg:text-[64px]">
            Live protocol activity —
            <br className="hidden sm:block" />
            <span className="text-white/85"> then dive into every tool.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-6 max-w-xl text-[16px] leading-[1.6] text-white/65">
            Follow live on-chain activity across the Nox protocol in one feed.
            Open the dashboard for TVS, charts, and every module in the sidebar.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/tvs" className="btn-yellow inline-flex items-center gap-2">
              Enter with TVS Dashboard
              <span aria-hidden>→</span>
            </Link>
            <a
              href="https://iex.ec"
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
