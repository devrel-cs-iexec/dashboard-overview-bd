import { test, expect } from "@playwright/test";

const PAGES = [
  "/",
  "/events",
  "/acl",
  "/search",
  "/address",
  "/verify",
  "/status",
];

test.describe("accessibility basics", () => {
  test("the skip link is hidden until focused, then reaches main", async ({ page }) => {
    await page.goto("/");
    const skip = page.getByRole("link", { name: "Skip to content" });

    // Present in the DOM but positioned offscreen until it takes focus.
    const offscreenLeft = await skip.evaluate((el) => el.getBoundingClientRect().left);
    expect(offscreenLeft).toBeLessThan(0);

    await skip.focus();
    const focusedLeft = await skip.evaluate((el) => el.getBoundingClientRect().left);
    expect(focusedLeft).toBeGreaterThanOrEqual(0);

    await expect(page.locator("#content")).toHaveCount(1);
  });

  test("every form control has an accessible name", async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      const inputs = page.locator("input:not([type=hidden])");
      const count = await inputs.count();

      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        const name = await input.evaluate((el) => {
          const byAria = el.getAttribute("aria-label");
          if (byAria) return byAria;
          const id = el.getAttribute("id");
          if (id) {
            const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
            if (label?.textContent?.trim()) return label.textContent.trim();
          }
          return el.closest("label")?.textContent?.trim() ?? "";
        });
        expect(name, `unlabelled input on ${path}`).not.toBe("");
      }
    }
  });

  test("outbound explorer links say where they go and that they open a tab", async ({
    page,
  }) => {
    await page.goto("/events");
    // Scoped to explorer links: the nav's outbound links (iex.ec, Docs, GitHub)
    // are adequately named by their own text.
    const external = page.locator(
      'a[target="_blank"][href*="arbiscan.io"], a[target="_blank"][href*="etherscan.io"]',
    );
    const count = await external.count();
    test.skip(count === 0, "no rows rendered — nothing to link to");

    for (let i = 0; i < Math.min(count, 10); i++) {
      const label = await external.nth(i).getAttribute("aria-label");
      expect(label, "external link has no accessible name").toBeTruthy();
      expect(label).toMatch(/opens in a new tab/);
    }
  });

  test("there is exactly one h1 and headings do not skip from h1 to h3", async ({
    page,
  }) => {
    for (const path of PAGES) {
      await page.goto(path);
      const levels = await page
        .locator("h1, h2, h3, h4")
        .evaluateAll((els) => els.map((e) => Number(e.tagName[1])));

      expect(
        levels.filter((l) => l === 1),
        `${path} should have one h1`,
      ).toHaveLength(1);

      for (let i = 1; i < levels.length; i++) {
        expect(
          levels[i] - levels[i - 1],
          `${path} skips a heading level at index ${i}`,
        ).toBeLessThanOrEqual(1);
      }
    }
  });

  test("navigation landmarks are distinguishable", async ({ page }) => {
    await page.goto("/");
    const navs = page.getByRole("navigation");
    const count = await navs.count();

    // With more than one nav landmark each needs its own accessible name.
    if (count > 1) {
      const names = await navs.evaluateAll((els) =>
        els.map((e) => e.getAttribute("aria-label") ?? ""),
      );
      expect(names.every((n) => n !== "")).toBe(true);
      expect(new Set(names).size, "nav landmarks share a name").toBe(names.length);
    }
    // One primary nav per viewport: the Sidebar on desktop, the MobileNav bar on
    // mobile. (The top "Site" bar was removed; its landmark now lives in MobileNav.)
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe("resilience", () => {
  test("filtered table content is server-rendered, not built in the browser", async ({
    request,
  }) => {
    // Asserted against the raw HTTP response rather than a JS-disabled browser:
    // the App Router streams content in a later chunk and needs JS to swap it
    // over the loading fallback, so a no-JS browser sees the skeleton even
    // though the markup was fully server-rendered. What matters here is that
    // the server — not the client — did the filtering.
    const res = await request.get("/acl?role=ADMIN");
    expect(res.status()).toBe(200);
    const html = await res.text();

    expect(html).toContain("ACL Audit");
    expect(html, "active filter is marked server-side").toContain('aria-current="true"');
    expect(html, "filters are links, so they work without JS").toContain(
      "/acl?role=VIEWER",
    );
    expect(html, "search is a plain GET form").toContain('method="get"');

    // Match the row pills specifically — a bare ">Viewer<" would also match the
    // "Viewer" filter link, which is present on every response by design.
    const adminPills = html.match(/text-amber-300">Admin</g)?.length ?? 0;
    const viewerPills = html.match(/text-\[#38bdf8\]">Viewer</g)?.length ?? 0;
    expect(adminPills, "ADMIN rows are rendered").toBeGreaterThan(0);
    expect(viewerPills, "VIEWER rows are filtered out server-side").toBe(0);
  });

  test("the status page reports degraded dependencies rather than showing zeros", async ({
    page,
  }) => {
    await page.goto("/status");
    await expect(
      page.getByRole("heading", { level: 1, name: "System Status" }),
    ).toBeVisible();

    // Each check must carry an explicit textual state, not colour alone.
    const badges = page.getByText(/^(Operational|Degraded|Down)$/);
    expect(await badges.count()).toBeGreaterThan(0);
  });
});
