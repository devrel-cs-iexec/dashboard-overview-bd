import Link from "next/link";

export function Header({ lagSeconds }: { lagSeconds: number }) {
  const healthy = lagSeconds < 120;
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-6 pt-6 lg:px-10">
      <Link href="/" className="group flex items-center gap-2.5">
        <NoxMark />
        <span className="font-display text-[15px] font-semibold tracking-tight">
          Nox<span className="text-[var(--color-accent)]">·</span>Stats
        </span>
      </Link>
      <div className="hidden items-center gap-6 text-[13px] text-[var(--color-muted)] sm:flex">
        <a
          href="https://docs.iex.ec"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-white"
        >
          Docs
        </a>
        <a
          href="https://github.com/iExec-Nox"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-white"
        >
          GitHub
        </a>
        <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/60 px-3 py-1.5 text-[12px]">
          <span
            className={`pulse-dot inline-block size-1.5 rounded-full ${
              healthy ? "text-emerald-400" : "text-amber-400"
            }`}
            style={{ background: "currentColor" }}
          />
          <span className="text-white/80">ARB + ETH Sepolia</span>
        </div>
      </div>
    </header>
  );
}

function NoxMark() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="nox-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFD21F" />
          <stop offset="1" stopColor="#FFB300" />
        </linearGradient>
      </defs>
      <path
        d="M6 4h4l12 16V4h4v24h-4L10 12v16H6V4Z"
        fill="url(#nox-g)"
      />
    </svg>
  );
}
