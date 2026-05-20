import Link from "next/link";

type NavItem = {
  key: string;
  label: string;
  href?: string;
  active?: boolean;
  soon?: boolean;
};

const SECTIONS: { kicker: string; items: NavItem[] }[] = [
  {
    kicker: "Dashboards",
    items: [
      { key: "tvs", label: "TVS Dashboard", href: "/tvs", active: true },
      { key: "transfers", label: "Confidential Transfers", soon: true },
      { key: "wraps", label: "Shield / Unshield", soon: true },
      { key: "events", label: "Nox Events", soon: true },
      { key: "address", label: "Address Profile", soon: true },
    ],
  },
  {
    kicker: "Compute",
    items: [
      { key: "ops", label: "Operation Stats", soon: true },
      { key: "viewers", label: "Public Decryption", soon: true },
      { key: "acl", label: "ACL Audit", soon: true },
    ],
  },
  {
    kicker: "Search",
    items: [
      { key: "search", label: "Advanced Search", soon: true },
      { key: "block", label: "Block Inspector", soon: true },
      { key: "verify", label: "Input Verification", soon: true },
    ],
  },
];

export function Sidebar({ rlcPrice }: { rlcPrice?: number }) {
  return (
    <aside className="hidden w-[244px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)]/70 backdrop-blur-md lg:flex lg:flex-col">
      <Link
        href="/"
        className="flex items-center gap-2.5 border-b border-[var(--color-border)] px-5 py-5"
      >
        <NoxMark />
        <span className="font-display text-[14px] font-semibold uppercase tracking-[0.08em]">
          Nox<span className="text-[var(--color-accent)]">·</span>Stats
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {SECTIONS.map((section) => (
          <div key={section.kicker} className="mb-5">
            <div className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted-2)]">
              {section.kicker}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.key}>
                  <NavLink item={item} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--color-border)] px-5 py-4">
        <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-[var(--color-muted-2)]">
          <span className="uppercase tracking-[0.18em]">RLC</span>
          <span className="text-[var(--color-foreground)]">
            {typeof rlcPrice === "number" && rlcPrice > 0
              ? `$${rlcPrice.toFixed(4)}`
              : "—"}
          </span>
        </div>
        <Spark />
        <div className="mt-3 flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
          <span className="size-1.5 rounded-full bg-[var(--color-positive)] pulse-dot text-[var(--color-positive)]" />
          Arbitrum Sepolia
        </div>
      </div>
    </aside>
  );
}

function NavLink({ item }: { item: NavItem }) {
  const base =
    "group flex items-center justify-between rounded-md px-3 py-2 text-[13px] transition-colors";
  if (item.active) {
    return (
      <span
        className={`${base} bg-[var(--color-accent-dim)] font-semibold text-[var(--color-accent-soft)] ring-1 ring-inset ring-[var(--color-accent)]/30`}
      >
        <span className="flex items-center gap-2.5">
          <Dot accent />
          {item.label}
        </span>
      </span>
    );
  }
  if (item.soon) {
    return (
      <span
        className={`${base} cursor-not-allowed text-[var(--color-muted-2)] opacity-80`}
      >
        <span className="flex items-center gap-2.5">
          <Dot />
          {item.label}
        </span>
        <span className="rounded border border-[var(--color-border)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-muted-2)]">
          soon
        </span>
      </span>
    );
  }
  return (
    <Link
      href={item.href ?? "#"}
      className={`${base} text-[var(--color-muted)] hover:bg-white/[0.03] hover:text-white`}
    >
      <span className="flex items-center gap-2.5">
        <Dot />
        {item.label}
      </span>
    </Link>
  );
}

function Dot({ accent }: { accent?: boolean }) {
  return (
    <span
      aria-hidden
      className={`size-1.5 rounded-full ${
        accent ? "bg-[var(--color-accent)]" : "bg-white/20"
      }`}
    />
  );
}

function Spark() {
  // Static, decorative — just a vibe element until we wire a real price chart
  return (
    <svg
      viewBox="0 0 100 22"
      width="100%"
      height="22"
      className="mt-2 text-[var(--color-accent)]/80"
      aria-hidden
    >
      <defs>
        <linearGradient id="spark-g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 16 L8 12 L16 14 L24 9 L32 11 L40 6 L48 9 L56 4 L64 7 L72 5 L80 8 L88 6 L100 9 L100 22 L0 22 Z"
        fill="url(#spark-g)"
      />
      <path
        d="M0 16 L8 12 L16 14 L24 9 L32 11 L40 6 L48 9 L56 4 L64 7 L72 5 L80 8 L88 6 L100 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NoxMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient id="nox-mark-g" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#92a1ff" />
          <stop offset="1" stopColor="#6e7edf" />
        </linearGradient>
      </defs>
      <path d="M6 4h4l12 16V4h4v24h-4L10 12v16H6V4Z" fill="url(#nox-mark-g)" />
    </svg>
  );
}
