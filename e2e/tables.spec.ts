import { test, expect } from "@playwright/test";

/**
 * The Events and ACL tables drive filtering through the URL and render
 * server-side. These tests assert the contract that makes that worthwhile:
 * filters are shareable, survive reload, and reset pagination.
 */
test.describe("URL-driven table filters", () => {
  test("ACL role filter writes to the URL and marks itself current", async ({ page }) => {
    await page.goto("/acl");

    const roles = page.getByRole("group", { name: "Filter by role" });
    await roles.getByRole("link", { name: "Admin" }).click();

    await expect(page).toHaveURL(/[?&]role=ADMIN/);
    await expect(roles.locator('[aria-current="true"]')).toHaveText(/Admin/i);
  });

  test("a filtered view survives a reload", async ({ page }) => {
    await page.goto("/acl?role=VIEWER");
    await expect(
      page
        .getByRole("group", { name: "Filter by role" })
        .locator('[aria-current="true"]'),
    ).toHaveText(/Viewer/i);

    await page.reload();
    await expect(
      page
        .getByRole("group", { name: "Filter by role" })
        .locator('[aria-current="true"]'),
    ).toHaveText(/Viewer/i);
  });

  test("filters compose, and changing one resets the page", async ({ page }) => {
    await page.goto("/events?cat=token&page=3");

    await page
      .getByRole("group", { name: "Filter by chain" })
      .getByRole("link", { name: "ARB", exact: true })
      .click();

    // Link navigation is client-side, so wait for the URL to settle rather
    // than reading it straight after the click.
    await expect(page).toHaveURL(/[?&]chain=arb/);
    const url = new URL(page.url());
    expect(url.searchParams.get("cat"), "unrelated filter is preserved").toBe("token");
    expect(url.searchParams.get("chain")).toBe("arb");
    expect(url.searchParams.get("page"), "page resets when a filter changes").toBeNull();
  });

  test("the 'All' option clears its param rather than encoding a default", async ({
    page,
  }) => {
    await page.goto("/events?cat=token");
    await page
      .getByRole("group", { name: "Filter by category" })
      .getByRole("link", { name: "All", exact: true })
      .click();

    await expect(page).toHaveURL((u) => !u.searchParams.has("cat"));
  });

  test("search submits as a GET form and preserves other filters", async ({ page }) => {
    await page.goto("/acl?role=ADMIN");

    await page.getByLabel("Search ACL grants by address").fill("0xabc");
    await page.getByRole("button", { name: "Go" }).click();

    const url = new URL(page.url());
    expect(url.searchParams.get("q")).toBe("0xabc");
    expect(url.searchParams.get("role"), "existing filter rides along").toBe("ADMIN");
  });

  test("an out-of-range page clamps instead of rendering an empty table", async ({
    page,
  }) => {
    await page.goto("/events?page=99999");
    // paginate() clamps to the last page, so the indicator must stay coherent.
    const indicator = page.getByText(/^\d+ \/ \d+$/).first();
    const [current, total] = (await indicator.innerText())
      .split("/")
      .map((s) => Number(s.trim()));
    expect(current).toBeLessThanOrEqual(total);
    expect(current).toBeGreaterThanOrEqual(1);
  });

  test("a zero-result filter reports 0, never '1-0 of 0'", async ({ page }) => {
    await page.goto("/acl?q=zzz-definitely-no-such-address");

    await expect(page.getByText("No grants match the current filter.")).toBeVisible();
    // Regression guard: EventsTable and AclTable used to render "1–0 of 0".
    await expect(page.locator("body")).not.toContainText("1–0 of 0");
    await expect(page.getByText(/\b0[–-]0 of 0 grants\b/)).toBeVisible();
  });

  test("pagination controls are inert at the boundaries", async ({ page }) => {
    await page.goto("/events");
    // On the first page "Prev" must not be a link to nowhere.
    await expect(page.getByRole("link", { name: "Previous page" })).toHaveCount(0);
    await expect(page.locator('[aria-disabled="true"]').first()).toBeVisible();
  });
});

test.describe("table accessibility", () => {
  test("tables are labelled and their headers scoped", async ({ page }) => {
    await page.goto("/acl");
    const table = page.locator("table").first();

    await expect(table.locator("caption")).toHaveCount(1);

    const headers = table.locator("thead th");
    const count = await headers.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(headers.nth(i)).toHaveAttribute("scope", "col");
    }
  });

  test("tables can actually scroll horizontally", async ({ page }) => {
    await page.goto("/events");
    const scroller = page.locator("div.overflow-x-auto").first();
    const table = scroller.locator("table");

    // The bug was `w-full` with no min-width: the table shrank to its container
    // so the scroll container never engaged and columns compressed instead.
    const tableWidth = await table.evaluate((el) => el.getBoundingClientRect().width);
    const minWidth = await table.evaluate((el) =>
      parseFloat(getComputedStyle(el).minWidth),
    );
    expect(minWidth).toBeGreaterThan(0);
    expect(tableWidth).toBeGreaterThanOrEqual(minWidth - 1);
  });
});

test.describe("TVS table", () => {
  /** Reads the "filtered / total" counter the toolbar renders. */
  async function counts(page: import("@playwright/test").Page) {
    const text = await page
      .getByRole("status")
      .filter({ hasText: "/" })
      .first()
      .innerText();
    const [filtered, total] = text
      .split("/")
      .map((s) => Number(s.trim().replace(/,/g, "")));
    return { filtered, total };
  }

  test("the page renders rows at all", async ({ page }) => {
    // Guards every other assertion here: without this they would all pass
    // vacuously against an empty table.
    await page.goto("/");
    const { total } = await counts(page);
    expect(total, "no events — the rest of this suite would be vacuous").toBeGreaterThan(
      0,
    );
    await expect(page.getByText("No events match the current filter.")).toHaveCount(0);
  });

  test("exactly one page of rows is sent, never the whole set", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    const { total } = await counts(page);
    expect(total, "need more events than one page to prove slicing").toBeGreaterThan(20);

    const html = await (await request.get("/")).text();
    const rows = html.match(/aria-label="View transaction/g)?.length ?? 0;
    // TVS_PAGE_SIZE is 20. The client version serialised all `total` events.
    expect(rows).toBeGreaterThan(0);
    expect(rows).toBeLessThanOrEqual(20);
    expect(rows).toBeLessThan(total);
  });

  test("page 2 shows different rows than page 1", async ({ request }) => {
    const txs = async (url: string) => {
      const html = await (await request.get(url)).text();
      return [...html.matchAll(/aria-label="View transaction (0x[a-f0-9]+)/g)].map(
        (m) => m[1],
      );
    };
    const first = await txs("/");
    const second = await txs("/?page=2");

    expect(first.length).toBeGreaterThan(0);
    expect(second.length).toBeGreaterThan(0);
    expect(second, "page 2 repeats page 1").not.toEqual(first);
    expect(
      first.filter((t) => second.includes(t)),
      "pages overlap",
    ).toHaveLength(0);
  });

  test("a direction filter actually narrows the result set", async ({ page }) => {
    await page.goto("/");
    const all = await counts(page);

    await page.goto("/?dir=shield");
    const shield = await counts(page);
    await page.goto("/?dir=unshield");
    const unshield = await counts(page);

    expect(shield.total, "total is the unfiltered count").toBe(all.total);
    expect(shield.filtered + unshield.filtered).toBe(all.filtered);
    expect(shield.filtered).toBeLessThanOrEqual(all.filtered);
  });

  test("direction filter is URL-driven and shareable", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("group", { name: "Filter by direction" })
      .getByRole("link", { name: "Shield", exact: true })
      .click();

    await expect(page).toHaveURL(/[?&]dir=shield/);
    await expect(
      page
        .getByRole("group", { name: "Filter by direction" })
        .locator('[aria-current="true"]'),
    ).toHaveText(/Shield/i);
  });

  test("/ and /wraps read the same query string identically", async ({ page }) => {
    await page.goto("/?dir=shield");
    const root = await counts(page);
    await page.goto("/wraps?dir=shield");
    const wraps = await counts(page);

    // Both share filterTvsEvents, so the counts must agree — and be non-zero,
    // or this proves nothing.
    expect(root.total).toBeGreaterThan(0);
    expect(wraps).toEqual(root);
  });
});
