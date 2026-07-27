export type NavItem = {
  label: string;
  href: string;
};

export type NavSection = {
  kicker: string;
  items: NavItem[];
};

/**
 * Single source of truth for dashboard navigation. Consumed by the desktop
 * Sidebar and the mobile drawer so the two can never drift apart.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    kicker: "Dashboards",
    items: [
      { label: "TVS Dashboard", href: "/" },
      { label: "Confidential Transfers", href: "/transfers" },
      { label: "Shield / Unshield", href: "/wraps" },
      { label: "Nox Events", href: "/events" },
      { label: "Address Profile", href: "/address" },
    ],
  },
  {
    kicker: "Compute",
    items: [
      { label: "Operation Stats", href: "/ops" },
      { label: "Public Decryption", href: "/viewers" },
      { label: "ACL Audit", href: "/acl" },
    ],
  },
  {
    kicker: "Search",
    items: [
      { label: "Advanced Search", href: "/search" },
      { label: "Input Verification", href: "/verify" },
    ],
  },
  {
    kicker: "System",
    items: [{ label: "System Status", href: "/status" }],
  },
];

/** Exact match — every route here is a leaf, so no prefix matching needed. */
export function isActiveHref(pathname: string, href: string): boolean {
  return pathname === href;
}
