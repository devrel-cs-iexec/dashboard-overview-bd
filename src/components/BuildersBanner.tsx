import Image from "next/image";

type Builder = {
  id: string;
  name: string;
  href: string;
  /** Image src under /public, OR null to render a styled wordmark */
  src?: string;
  alt?: string;
  /** Wordmark style hint */
  wordmark?: React.ReactNode;
};

const BUILDERS: Builder[] = [
  {
    id: "real",
    name: "Real.finance",
    href: "https://real.finance",
    wordmark: (
      <span className="flex items-center gap-1.5 font-display text-[26px] font-semibold tracking-tight text-[var(--color-page-fg)]">
        Real
        <span className="size-1.5 translate-y-2 rounded-full bg-[var(--color-lavender)]" />
      </span>
    ),
  },
  {
    id: "zyf",
    name: "Zyf.ai",
    href: "https://zyf.ai",
    src: "/builders/zyf-ai.png",
    alt: "Zyf.ai",
  },
  {
    id: "bond",
    name: "Bond.credit",
    href: "https://bond.credit",
    src: "/builders/bond-credit.svg",
    alt: "Bond.credit",
  },
];

export function BuildersBanner() {
  return (
    <section className="border-y border-[var(--color-page-border)] bg-[var(--color-page-3)]">
      <div className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-10 lg:py-20">
        <div className="text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-lavender)]">
            Builders on the Nox protocol
          </div>
          <h2 className="font-display mx-auto mt-3 max-w-3xl text-[28px] font-medium leading-[1.1] tracking-[-0.02em] text-[var(--color-page-fg)] sm:text-[34px]">
            Already trusted by leading projects shipping with confidential compute.
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 items-center gap-6 sm:grid-cols-3">
          {BUILDERS.map((b) => (
            <BuilderTile key={b.id} builder={b} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BuilderTile({ builder }: { builder: Builder }) {
  return (
    <a
      href={builder.href}
      target="_blank"
      rel="noreferrer"
      className="card-light group flex h-32 items-center justify-center gap-3 px-6"
      aria-label={`${builder.name} — visit site`}
    >
      <span className="opacity-90 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0">
        {builder.src ? (
          <Image
            src={builder.src}
            alt={builder.alt ?? builder.name}
            width={builder.id === "zyf" ? 44 : 180}
            height={builder.id === "zyf" ? 44 : 32}
            className={builder.id === "zyf" ? "h-11 w-auto" : "h-7 w-auto"}
          />
        ) : (
          builder.wordmark
        )}
      </span>
      {builder.id === "zyf" ? (
        <span className="font-display text-[22px] font-medium tracking-tight text-[var(--color-page-fg)]">
          zyf.ai
        </span>
      ) : null}
    </a>
  );
}
