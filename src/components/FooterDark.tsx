export function FooterDark() {
  return (
    <footer className="bg-[var(--color-shell)]">
      <div className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-10 lg:py-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#1a1e36] via-[#222a4a] to-[#2c2546] p-10 lg:p-14">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <h2 className="font-display text-[36px] font-semibold leading-[1.05] tracking-[-0.02em] text-white sm:text-[44px]">
                Programmable Privacy
                <br />
                for Web3
              </h2>
              <div className="mt-6 flex items-center gap-3 text-white/70">
                <a
                  href="https://x.com/iEx_ec"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-white/5 p-2 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="X"
                >
                  <SocialIcon name="x" />
                </a>
                <a
                  href="https://discord.com/invite/5TewNUnJHN"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-white/5 p-2 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Discord"
                >
                  <SocialIcon name="discord" />
                </a>
                <a
                  href="https://github.com/iExec-Nox"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-white/5 p-2 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="GitHub"
                >
                  <SocialIcon name="github" />
                </a>
              </div>
            </div>

            <ul className="space-y-3 text-[15px] text-white/80">
              <li>
                <a
                  href="mailto:contact@iex.ec?subject=NoxStats%20%E2%80%94%20contact"
                  className="transition-colors hover:text-white"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="/status"
                  className="transition-colors hover:text-white"
                >
                  Status Page
                </a>
              </li>
              <li>
                <a
                  href="https://docs.iex.ec"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-white"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/devrel-cs-iexec/dashboard-overview-bd"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-white"
                >
                  Source on GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-white/40">
          Built for the iExec ecosystem · Arbitrum Sepolia · pure RPC + subgraph
        </p>
      </div>
    </footer>
  );
}

function SocialIcon({ name }: { name: "x" | "discord" | "github" }) {
  const common = "size-[14px]";
  if (name === "x") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="currentColor" aria-hidden>
        <path d="M18.244 2H21.5l-7.13 8.151L23 22h-6.836l-5.357-7.005L4.7 22H1.44l7.61-8.701L1 2h6.99l4.85 6.413L18.244 2Zm-2.4 18h1.879L7.244 4h-1.94l10.54 16Z" />
      </svg>
    );
  }
  if (name === "discord") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="currentColor" aria-hidden>
        <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.733 13.733 0 0 0-.61 1.255 18.27 18.27 0 0 0-5.487 0 12.46 12.46 0 0 0-.617-1.255.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .031-.056c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.029Zm-12.27 11.012c-1.182 0-2.156-1.086-2.156-2.419 0-1.333.955-2.42 2.157-2.42 1.21 0 2.176 1.096 2.156 2.42 0 1.333-.955 2.42-2.156 2.42Zm7.974 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.42 2.157-2.42 1.21 0 2.176 1.096 2.156 2.42 0 1.333-.946 2.42-2.156 2.42Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55v-2.06c-3.2.7-3.88-1.37-3.88-1.37-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.02 1.76 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18.92-.26 1.91-.39 2.9-.39.98 0 1.97.13 2.9.39 2.21-1.49 3.18-1.18 3.18-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.08 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.14v3.17c0 .31.21.66.79.55 4.56-1.52 7.85-5.83 7.85-10.91C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}
