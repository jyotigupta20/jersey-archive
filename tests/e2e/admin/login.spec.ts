import { test, expect } from "@playwright/test";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

test.describe("Admin login", () => {
  test("shows password form at /admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator('[data-testid="admin-password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-login-button"]')).toBeVisible();
  });

  test("wrong password shows error", async ({ page }) => {
    await page.goto("/admin");
    await page.locator('[data-testid="admin-password-input"]').fill("wrong-password-xyz");
    await page.locator('[data-testid="admin-login-button"]').click();
    await expect(page.locator("body")).toContainText(/invalid password/i);
  });

  test("correct password shows admin sidebar", async ({ page }) => {
    await page.goto("/admin");
    await page.locator('[data-testid="admin-password-input"]').fill(ADMIN_PASSWORD);
    await page.locator('[data-testid="admin-login-button"]').click();
    await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible({ timeout: 10_000 });
  });

  test("sign out returns to login form", async ({ page }) => {
    // Login first
    await page.goto("/admin");
    await page.locator('[data-testid="admin-password-input"]').fill(ADMIN_PASSWORD);
    await page.locator('[data-testid="admin-login-button"]').click();
    await page.locator('[data-testid="admin-sidebar"]').waitFor({ state: "visible", timeout: 10_000 });

    // Sign out
    const signOutBtn = page.locator("button").filter({ hasText: /sign out/i });
    await signOutBtn.click();
    await expect(page.locator('[data-testid="admin-password-input"]')).toBeVisible();
  });
});
