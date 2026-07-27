"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS, isActiveHref } from "@/lib/nav";
import { NoxMark } from "./NoxMark";

/**
 * Below `lg` the Sidebar is hidden, so this is the only way to reach the
 * dashboard sections on a phone. Renders a sticky bar plus a slide-in drawer.
 */
export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close on Escape, and lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const current = NAV_SECTIONS.flatMap((s) => s.items).find((i) =>
    isActiveHref(pathname, i.href),
  );

  return (
    <div className="lg:hidden">
      <nav
        aria-label="Site"
        className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 py-3 backdrop-blur"
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
          {current?.label ?? "Nox·Stats"}
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="mobile-nav-drawer"
          className="focus-ring inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]/60 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-foreground)]"
        >
          <BurgerIcon />
          Menu
        </button>
      </nav>

      {open ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard sections"
            className="relative ml-auto flex h-full w-[280px] max-w-[85vw] flex-col overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-shell)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <span className="flex items-center gap-2.5">
                <NoxMark />
                <span className="font-display text-[14px] font-semibold uppercase tracking-[0.08em]">
                  Nox<span className="text-[var(--color-accent)]">·</span>Stats
                </span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="focus-ring rounded-md px-2 py-1 text-[18px] leading-none text-[var(--color-muted)] hover:text-white"
              >
                ×
              </button>
            </div>

            <nav aria-label="Dashboard sections" className="flex-1 px-3 py-4">
              {NAV_SECTIONS.map((section) => (
                <div key={section.kicker} className="mb-5">
                  <h2 className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted-2)]">
                    {section.kicker}
                  </h2>
                  <ul className="space-y-0.5">
                    {section.items.map((item) => {
                      const active = isActiveHref(pathname, item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            aria-current={active ? "page" : undefined}
                            className={
                              active
                                ? "focus-ring flex items-center gap-2.5 rounded-md bg-[var(--color-accent-dim)] px-3 py-2.5 text-[14px] font-semibold text-[var(--color-accent-soft)]"
                                : "focus-ring flex items-center gap-2.5 rounded-md px-3 py-2.5 text-[14px] text-[var(--color-muted)]"
                            }
                          >
                            <span
                              aria-hidden
                              className={`size-1.5 rounded-full ${
                                active ? "bg-[var(--color-accent)]" : "bg-white/20"
                              }`}
                            />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BurgerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2 4h12M2 8h12M2 12h12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
