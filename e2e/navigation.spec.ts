import { test, expect } from "@playwright/test";

/**
 * Every route reachable from the sidebar. Kept in sync with lib/nav.ts by the
 * "sidebar lists every route" test below.
 */
const ROUTES = [
  { href: "/", heading: "TVS Dashboard" },
  { href: "/transfers", heading: "Confidential Transfers" },
  { href: "/wraps", heading: "Shield / Unshield" },
  { href: "/events", heading: "Nox Events" },
  { href: "/address", heading: "Address Profile" },
  { href: "/ops", heading: "Operation Stats" },
  { href: "/viewers", heading: "Public Decryption" },
  { href: "/acl", heading: "ACL Audit" },
  { href: "/search", heading: "Advanced Search" },
  { href: "/verify", heading: "Input Verification" },
  { href: "/status", heading: "System Status" },
];

test.describe("routing", () => {
  for (const { href, heading } of ROUTES) {
    test(`${href} renders its page heading`, async ({ page }) => {
      const response = await page.goto(href);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    });
  }

  test("/tvs permanently redirects to the dashboard root", async ({ page }) => {
    await page.goto("/tvs");
    expect(new URL(page.url()).pathname).toBe("/");
    await expect(
      page.getByRole("heading", { level: 1, name: "TVS Dashboard" }),
    ).toBeVisible();
  });

  test("an unknown route renders the custom 404", async ({ page }) => {
    const response = await page.goto("/definitely-not-a-page");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "No such page." })).toBeVisible();
  });

  test("every page exposes exactly one main landmark and h1", async ({ page }) => {
    for (const { href } of ROUTES) {
      await page.goto(href);
      await expect(page.locator("main#content")).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    }
  });
});

test.describe("desktop navigation", () => {
  test.skip(({ isMobile }) => !!isMobile, "sidebar is hidden below lg");

  test("sidebar links reach every route and mark the current one", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.getByRole("navigation", { name: "Dashboard sections" });
    await expect(sidebar).toBeVisible();

    // The active item is the only one carrying aria-current.
    await expect(sidebar.locator('[aria-current="page"]')).toHaveText(/TVS Dashboard/);

    await sidebar.getByRole("link", { name: "ACL Audit" }).click();
    await expect(page).toHaveURL(/\/acl$/);
    await expect(
      page
        .getByRole("navigation", { name: "Dashboard sections" })
        .locator('[aria-current="page"]'),
    ).toHaveText(/ACL Audit/);
  });

  test("sidebar lists every route the app serves", async ({ page }) => {
    await page.goto("/");
    const hrefs = await page
      .getByRole("navigation", { name: "Dashboard sections" })
      .getByRole("link")
      .evaluateAll((links) =>
        links.map((l) => new URL((l as HTMLAnchorElement).href).pathname),
      );
    for (const { href } of ROUTES) {
      expect(hrefs, `sidebar is missing ${href}`).toContain(href);
    }
  });
});

test.describe("mobile navigation", () => {
  test.skip(({ isMobile }) => !isMobile, "drawer only exists below lg");

  test("the drawer is the only way to reach other sections, and it works", async ({
    page,
  }) => {
    await page.goto("/");

    // The desktop sidebar must genuinely be absent, not merely offscreen.
    await expect(
      page.getByRole("navigation", { name: "Dashboard sections" }),
    ).toBeHidden();

    const menu = page.getByRole("button", { name: /menu/i });
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute("aria-expanded", "false");

    await menu.click();
    const drawer = page.getByRole("dialog", { name: "Dashboard sections" });
    await expect(drawer).toBeVisible();
    await expect(menu).toHaveAttribute("aria-expanded", "true");

    await drawer.getByRole("link", { name: "Nox Events" }).click();
    await expect(page).toHaveURL(/\/events$/);
    await expect(drawer).toBeHidden();
  });

  test("Escape closes the drawer", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /menu/i }).click();
    const drawer = page.getByRole("dialog", { name: "Dashboard sections" });
    await expect(drawer).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
  });
});
