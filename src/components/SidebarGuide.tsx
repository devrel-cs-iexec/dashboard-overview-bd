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
    key: "address",
    title: "Address Profile",
    description:
      "Unified timeline for any wallet: staking, rewards, wrap/unwrap, auctions, verification, Nox compute, decryption, and more — with shareable URLs.",
  },
  {
    key: "operator",
    title: "Operator Staking",
    description:
      "Operator vaults, protocol staking, KMS and coprocessor pools, deposits, withdrawals, and on-chain TVL context.",
  },
  {
    key: "tvs",
    title: "TVS Dashboard",
    description:
      "Total value shielded per token, wrapper events, and the shielding activity that feeds protocol metrics.",
    href: "/tvs",
    active: true,
  },
  {
    key: "transfers",
    title: "Confidential Transfers",
    description:
      "On-chain confidential token transfers across supported wrappers — activity indexed for exploration and analytics.",
  },
  {
    key: "wraps",
    title: "Shield / Unshield",
    description:
      "Embedded flow to move assets between public balances and confidential (wrapped) balances.",
  },
  {
    key: "events",
    title: "Nox Events",
    description:
      "Nox contract event stream — the raw signals of confidential compute on-chain.",
  },
  {
    key: "user-decrypt",
    title: "User Decryption",
    description:
      "User-directed decryption on the Nox gateway — requests and results as they appear in the index.",
  },
  {
    key: "public-decrypt",
    title: "Public Decryption",
    description:
      "Public decryption pipeline — shared decrypt requests and responses for the community.",
  },
  {
    key: "search",
    title: "Advanced Search",
    description:
      "Search handles, ciphertexts, and related metadata when you already know what you are looking for.",
  },
  {
    key: "block",
    title: "Block Share Chart",
    description:
      "Network share and block-space style charts derived from indexed activity.",
  },
  {
    key: "verify",
    title: "Input Verification",
    description:
      "Input verification events — proofs and checks that gate confidential workflows.",
  },
  {
    key: "commits",
    title: "Ciphertext Commits",
    description:
      "Ciphertext material commits and coprocessor participation — consensus-style visibility into confidential state.",
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
              After you click <span className="text-[var(--color-lavender)]">Open Dashboard</span>,
              the left panel lists these sections.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-[1.55] text-[var(--color-page-muted)]">
              Same names, same routes. Today only the TVS Dashboard is live —
              everything else lights up as the backend (subgraph + WSS) is wired in.
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
