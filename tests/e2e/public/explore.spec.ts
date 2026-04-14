import { test, expect } from "@playwright/test";

test.describe("Explore page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/explore");
    await page.waitForLoadState("networkidle");
  });

  test("heading contains 'Explore'", async ({ page }) => {
    await expect(page.locator("h1, h2").first()).toContainText(/[Ee]xplore/);
  });

  test("shows jersey count", async ({ page }) => {
    const countText = page.locator("text=/\\d+ jerseys? found/i");
    await expect(countText).toBeVisible();
  });

  test("filter sidebar is visible", async ({ page }) => {
    const filters = page.locator('[data-testid="jersey-filters"]');
    await expect(filters).toBeVisible();
  });

  test("filter sidebar has Sport section", async ({ page }) => {
    const filters = page.locator('[data-testid="jersey-filters"]');
    await expect(filters).toContainText(/Sport/i);
  });

  test("clicking Cricket filter adds ?sport=cricket to URL", async ({ page }) => {
    const filters = page.locator('[data-testid="jersey-filters"]');
    // The sport section is the first section; click its first button (cricket)
    const cricketBtn = filters.locator("button").first();
    await cricketBtn.click();
    await expect(page).toHaveURL(/sport=cricket/i);
  });

  test("Clear all removes all filter params", async ({ page }) => {
    // Apply a filter first
    const filters = page.locator('[data-testid="jersey-filters"]');
    const firstBtn = filters.locator("button").first();
    await firstBtn.click();
    await page.waitForURL(/\?.+/);

    // Clear all
    const clearBtn = page.locator("button").filter({ hasText: /clear all/i });
    await clearBtn.click();
    await expect(page).toHaveURL(/\/explore(\?)?$/);
  });

  test("jersey grid is visible", async ({ page }) => {
    const grid = page.locator('[data-testid="jersey-grid"]');
    await expect(grid).toBeVisible();
  });
});
