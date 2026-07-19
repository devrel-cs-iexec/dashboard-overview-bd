import Link from "next/link";

type Variant = "dark" | "transparent";

export function TopNav({ variant = "dark" }: { variant?: Variant }) {
  const isTransparent = variant === "transparent";
  return (
    <header className="sticky top-3 z-30 mx-auto w-full max-w-7xl px-4">
      <nav
        className={`relative flex items-center justify-between gap-6 rounded-full px-3 py-2 sm:px-4 ${
          isTransparent
            ? "bg-transparent"
            : "bg-[var(--color-shell)] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/5"
        }`}
      >
        <Link href="/" className="flex items-center gap-2.5 pl-2">
          <NoxMark />
          <span className="font-display text-[14px] font-semibold tracking-tight text-white">
            Nox<span className="text-[var(--color-accent)]">·</span>Stats
          </span>
        </Link>

        <ul className="hidden items-center gap-1 text-[13px] sm:flex">
          <NavLink href="https://iex.ec" external>
            iex.ec
          </NavLink>
          <NavLink href="https://docs.iex.ec" external>
            Docs
          </NavLink>
          <NavLink
            href="https://github.com/devrel-cs-iexec/dashboard-overview-bd"
            external
          >
            GitHub
          </NavLink>
        </ul>

      </nav>
    </header>
  );
}

function NavLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const className =
    "rounded-full px-3 py-1.5 text-[var(--color-muted)] transition-colors hover:text-white";
  if (external) {
    return (
      <li>
        <a href={href} target="_blank" rel="noreferrer" className={className}>
          {children}
        </a>
      </li>
    );
  }
  return (
    <li>
      <Link href={href} className={className}>
        {children}
      </Link>
    </li>
  );
}

function NoxMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient id="nox-topnav-g" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#fcd15a" />
          <stop offset="1" stopColor="#fdb40e" />
        </linearGradient>
      </defs>
      <path d="M6 4h4l12 16V4h4v24h-4L10 12v16H6V4Z" fill="url(#nox-topnav-g)" />
    </svg>
  );
}
