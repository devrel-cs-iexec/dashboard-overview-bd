"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS, isActiveHref, type NavItem } from "@/lib/nav";
import { NoxMark } from "./NoxMark";

export function Sidebar({ rlcPrice }: { rlcPrice?: number }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[244px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)]/70 backdrop-blur-md lg:flex lg:flex-col">
      <Link
        href="/"
        className="flex items-center gap-2.5 border-b border-[var(--color-border)] px-5 py-5"
      >
        <NoxMark />
        <span className="font-display text-[14px] font-semibold uppercase tracking-[0.08em]">
          Nox<span className="text-[var(--color-accent)]">·</span>Dashboard
        </span>
      </Link>

      <nav aria-label="Dashboard sections" className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.kicker} className="mb-5">
            <h2 className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted-2)]">
              {section.kicker}
            </h2>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} active={isActiveHref(pathname, item.href)} />
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
      </div>
    </aside>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "focus-ring group flex items-center gap-2.5 rounded-md bg-[var(--color-accent-dim)] px-3 py-2 text-[13px] font-semibold text-[var(--color-accent-soft)] ring-1 ring-inset ring-[var(--color-accent)]/30"
          : "focus-ring group flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-[var(--color-muted)] transition-colors hover:bg-white/[0.03] hover:text-white"
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
  );
}
