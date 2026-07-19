import { NoxMark } from "./NoxMark";

const LINKS = [
  { href: "https://iex.ec", label: "iex.ec" },
  { href: "https://docs.iex.ec", label: "Docs" },
  { href: "https://github.com/devrel-cs-iexec/dashboard-overview-bd", label: "GitHub" },
];

export function TopNav() {
  return (
    <header className="sticky top-3 z-30 mx-auto w-full max-w-7xl px-4">
      <nav
        aria-label="Site"
        className="relative flex items-center justify-between gap-6 rounded-full bg-[var(--color-shell)] px-3 py-2 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/5 sm:px-4"
      >
        <span className="flex items-center gap-2.5 pl-2">
          <NoxMark tone="accent" />
          <span className="font-display text-[14px] font-semibold tracking-tight text-white">
            Nox<span className="text-[var(--color-accent)]">·</span>Stats
          </span>
        </span>

        <ul className="hidden items-center gap-1 text-[13px] sm:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="focus-ring rounded-full px-3 py-1.5 text-[var(--color-muted)] transition-colors hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
