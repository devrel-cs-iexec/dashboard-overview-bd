export function Footer() {
  return (
    <footer className="relative mt-12 border-t border-[var(--color-border)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center lg:px-10">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted-2)]">
          Nox·Stats · ARB + ETH Sepolia · Real-time · No wallet required
        </div>
        <div className="flex items-center gap-6 text-[13px] text-[var(--color-muted)]">
          <a className="transition-colors hover:text-white" href="https://docs.iex.ec" target="_blank" rel="noreferrer">
            Documentation
          </a>
          <a className="transition-colors hover:text-white" href="https://github.com/iExec-Nox" target="_blank" rel="noreferrer">
            Source
          </a>
          <a className="transition-colors hover:text-white" href="https://discord.com/invite/5TewNUnJHN" target="_blank" rel="noreferrer">
            Discord
          </a>
        </div>
      </div>
    </footer>
  );
}
