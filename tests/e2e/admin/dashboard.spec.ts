import { test, expect } from "@playwright/test";
import { adminLogin } from "../helpers/auth";

test.describe("Admin dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
  });

  test("shows stat cards with positive numbers", async ({ page }) => {
    // Look for any numeric stat display
    const statNumbers = page.locator("text=/^\\d+$/");
    const count = await statNumbers.count();
    expect(count).toBeGreaterThan(0);
  });

  test("quick action links are present", async ({ page }) => {
    // Should have links to other admin sections
    const adminLinks = page.locator('a[href*="/admin"]');
    const count = await adminLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});
