import Link from "next/link";

type Entry = {
  key: string;
  title: string;
  description: string;
  href?: string;
  active?: boolean;
};

const ENTRIES: Entry[] = [
  {
    key: "tvs",
    title: "TVS Dashboard",
    description:
      "Total value shielded per token across ARB and ETH Sepolia — shield/unshield flows, per-token TVL/TVS, and the merged activity feed.",
    href: "/tvs",
    active: true,
  },
  {
    key: "transfers",
    title: "Confidential Transfers",
    description:
      "ERC-7984 token events indexed by Ponder — mints, burns, and encrypted transfers across all supported wrappers.",
    href: "/transfers",
    active: true,
  },
  {
    key: "wraps",
    title: "Shield / Unshield",
    description:
      "Per-token breakdown of shielding activity: event counts, USD volumes, and the full merged event table.",
    href: "/wraps",
    active: true,
  },
  {
    key: "events",
    title: "Nox Events",
    description:
      "Every compute operation on-chain — arithmetic, comparisons, token ops, ACL changes — filterable by category.",
    href: "/events",
    active: true,
  },
  {
    key: "address",
    title: "Address Profile",
    description:
      "Enter any wallet to see its ACL grants (ADMIN/VIEWER) and shield/unshield history across all tokens and chains.",
    href: "/address",
    active: true,
  },
  {
    key: "ops",
    title: "Operation Stats",
    description:
      "Breakdown of all compute operations by category, top operations by count, and per-token holder/TVL metrics.",
    href: "/ops",
    active: true,
  },
  {
    key: "acl",
    title: "ACL Audit",
    description:
      "Full on-chain access control log — every address granted ADMIN or VIEWER rights over confidential handles.",
    href: "/acl",
    active: true,
  },
  {
    key: "viewers",
    title: "Public Decryption",
    description:
      "Handles marked publicly decryptable — anyone can request the plaintext value from the KMS for these outputs.",
    href: "/viewers",
    active: true,
  },
  {
    key: "search",
    title: "Advanced Search",
    description:
      "Look up every handle created in a transaction by tx hash, or jump straight to an address profile.",
    href: "/search",
    active: true,
  },
  {
    key: "block",
    title: "Block Inspector",
    description:
      "Enter an ARB Sepolia block number to see every Nox handle produced in that block — with operation type and tx link.",
    href: "/block",
    active: true,
  },
  {
    key: "verify",
    title: "Input Verification",
    description:
      "Paste a bytes32 handle ID to confirm it exists on-chain, see which operation produced it, and check decryptability.",
    href: "/verify",
    active: true,
  },
  {
    key: "status",
    title: "System Status",
    description:
      "Live health probe of every dependency — RPC, Ponder indexer, CoinGecko prices, and all wrapper contracts.",
    href: "/status",
    active: true,
  },
];

export function SidebarGuide() {
  return (
    <section className="bg-[var(--color-page)]">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="grid grid-cols-1 gap-x-12 gap-y-6 lg:grid-cols-[1fr_2fr]">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-lavender)]">
              Sidebar guide
            </div>
            <h2 className="font-display mt-3 text-[32px] font-medium leading-[1.08] tracking-[-0.02em] text-[var(--color-page-fg)] sm:text-[40px]">
              Every section is live — pick where to start.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-[1.55] text-[var(--color-page-muted)]">
              All sections are live. Each dashboard is powered by live RPC and the Ponder indexer — no wallet required.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ENTRIES.map((e) => (
              <EntryCard key={e.key} entry={e} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function EntryCard({ entry }: { entry: Entry }) {
  const inner = (
    <article className="card-light flex h-full flex-col gap-2 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-[15px] font-semibold tracking-tight text-[var(--color-page-fg)]">
          {entry.title}
        </h3>
        {entry.active ? (
          <span className="rounded-full bg-[var(--color-lavender-dim)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-lavender)]">
            Live
          </span>
        ) : (
          <span className="rounded-full border border-[var(--color-page-border)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-page-muted)]">
            Soon
          </span>
        )}
      </div>
      <p className="text-[13px] leading-[1.55] text-[var(--color-page-muted)]">
        {entry.description}
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-[13px]">
        {entry.active ? (
          <span className="font-medium text-[var(--color-lavender)]">
            Open section →
          </span>
        ) : (
          <span className="text-[var(--color-page-muted)]">Coming soon</span>
        )}
      </div>
    </article>
  );
  if (entry.href && entry.active) {
    return (
      <Link href={entry.href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
