import { test, expect } from "@playwright/test";

test.describe("Football page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/football");
    await page.waitForLoadState("networkidle");
  });

  test("h1 is 'Football Jerseys'", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Football Jerseys");
  });

  test("UCL results table is visible", async ({ page }) => {
    const table = page.locator("table");
    await expect(table).toBeVisible();
  });

  test("table has expected headers", async ({ page }) => {
    const headers = page.locator("table thead th, table th");
    const headerTexts = await headers.allTextContents();
    const lower = headerTexts.map((t) => t.toLowerCase());
    expect(lower.some((h) => h.includes("season"))).toBe(true);
    expect(lower.some((h) => h.includes("winner") || h.includes("club"))).toBe(true);
  });

  test("table has at least one data row", async ({ page }) => {
    const rows = page.locator("table tbody tr");
    await expect(rows.first()).toBeVisible();
    const firstRowCells = rows.first().locator("td");
    const firstCellText = await firstRowCells.first().textContent();
    expect(firstCellText?.trim().length).toBeGreaterThan(0);
  });
});
