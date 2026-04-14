import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("title contains Jersey Archive", async ({ page }) => {
    await expect(page).toHaveTitle(/Jersey Archive/i);
  });

  test("hero headline contains 'Every Kit'", async ({ page }) => {
    const hero = page.locator('[data-testid="hero-headline"]');
    await expect(hero).toContainText("Every Kit");
  });

  test("stats bar shows total > 0", async ({ page }) => {
    const total = page.locator('[data-testid="stats-total"]');
    await expect(total).toBeVisible();
    const text = await total.textContent();
    const num = parseInt((text || "0").replace(/,/g, ""), 10);
    expect(num).toBeGreaterThan(0);
  });

  test("jersey grid contains at least one card", async ({ page }) => {
    const grid = page.locator('[data-testid="jersey-grid"]');
    await expect(grid).toBeVisible();
    const cards = grid.locator('[data-testid="jersey-card"]');
    await expect(cards.first()).toBeVisible();
  });

  test("clicking a jersey card navigates to detail page", async ({ page }) => {
    const card = page.locator('[data-testid="jersey-card"]').first();
    await card.click();
    await expect(page).toHaveURL(/\/(cricket|football)\/.+/);
  });

  test("hero search form navigates to /search?q=", async ({ page }) => {
    const input = page.locator('section input[type="text"], section input:not([type])').first();
    await input.fill("india");
    await input.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=india/i);
  });

  test("Cricket sport card links to /cricket", async ({ page }) => {
    const cricketLink = page.locator('a[href="/cricket"]').first();
    await expect(cricketLink).toBeVisible();
  });

  test("Football sport card links to /football", async ({ page }) => {
    const footballLink = page.locator('a[href="/football"]').first();
    await expect(footballLink).toBeVisible();
  });
});
