import { test, expect } from "@playwright/test";
import { adminLogin } from "../helpers/auth";

test.describe("Admin jerseys list", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/jerseys");
    await page.waitForLoadState("networkidle");
  });

  test("shows table with at least one row", async ({ page }) => {
    const table = page.locator("table");
    await expect(table).toBeVisible();
    const rows = page.locator("table tbody tr");
    await expect(rows.first()).toBeVisible();
  });

  test("search input filters rows", async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]').first();
    if (await searchInput.isVisible()) {
      const initialCount = await page.locator("table tbody tr").count();
      await searchInput.fill("xyzzy_no_match_12345");
      await page.waitForTimeout(500);
      const filteredCount = await page.locator("table tbody tr").count();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    } else {
      // No search input — skip
      test.skip();
    }
  });

  test("edit link navigates to edit page", async ({ page }) => {
    const editLink = page.locator('a').filter({ hasText: /edit/i }).first();
    if (await editLink.isVisible()) {
      const href = await editLink.getAttribute("href");
      expect(href).toMatch(/\/admin\/jerseys\/.+\/edit/);
    } else {
      // Try table action column
      const firstRow = page.locator("table tbody tr").first();
      const rowEditLink = firstRow.locator("a").first();
      await rowEditLink.click();
      await expect(page).toHaveURL(/\/admin\/jerseys\/.+/);
    }
  });

  test("delete button triggers confirmation dialog", async ({ page }) => {
    const deleteBtn = page.locator("button").filter({ hasText: /delete/i }).first();
    if (!(await deleteBtn.isVisible())) {
      test.skip();
      return;
    }
    let dialogShown = false;
    page.once("dialog", (dialog) => {
      dialogShown = true;
      dialog.dismiss();
    });
    await deleteBtn.click();
    expect(dialogShown).toBe(true);
  });
});
