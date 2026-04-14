import { test, expect } from "@playwright/test";

test.describe("Cricket page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/cricket");
    await page.waitForLoadState("networkidle");
  });

  test("h1 is 'Cricket Jerseys'", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Cricket Jerseys");
  });

  test("subtitle contains jersey count", async ({ page }) => {
    // Count text is in a <p> near the h1 — check page contains a number
    await expect(page.locator("body")).toContainText(/\d+ jerseys/i);
  });

  test("IPL format quick-link is present", async ({ page }) => {
    const iplLink = page.locator("a, button").filter({ hasText: "IPL" }).first();
    await expect(iplLink).toBeVisible();
  });

  test("clicking IPL filter adds ?format=IPL to URL", async ({ page }) => {
    // Target the link that stays on /cricket (not the explore one)
    const iplLink = page.locator('a[href*="/cricket"][href*="format=IPL"], a[href*="format=IPL"]').first();
    await iplLink.click();
    await expect(page).toHaveURL(/format=IPL/);
  });

  test("filter sidebar renders", async ({ page }) => {
    const filters = page.locator('[data-testid="jersey-filters"]');
    await expect(filters).toBeVisible();
  });

  test("clicking a filter updates URL params", async ({ page }) => {
    const filters = page.locator('[data-testid="jersey-filters"]');
    const firstFilterButton = filters.locator("button").first();
    await firstFilterButton.click();
    await expect(page).toHaveURL(/\?.+/);
  });
});
