import { Page } from "@playwright/test";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

/**
 * Log in via the admin password form (UI-based login).
 */
export async function adminLogin(page: Page): Promise<void> {
  await page.goto("/admin");
  const passwordInput = page.locator('[data-testid="admin-password-input"]');
  const loginButton = page.locator('[data-testid="admin-login-button"]');

  // If already authenticated (sidebar visible), skip
  const sidebar = page.locator('[data-testid="admin-sidebar"]');
  if (await sidebar.isVisible().catch(() => false)) {
    return;
  }

  await passwordInput.fill(ADMIN_PASSWORD);
  await loginButton.click();
  await sidebar.waitFor({ state: "visible", timeout: 10_000 });
}

/**
 * Inject admin auth directly into sessionStorage (faster, for non-login tests).
 */
export async function setAdminSession(page: Page): Promise<void> {
  await page.goto("/admin");
  await page.evaluate((pwd) => {
    sessionStorage.setItem("admin_auth", "true");
    sessionStorage.setItem("admin_password", pwd);
  }, ADMIN_PASSWORD);
  await page.reload();
  await page.locator('[data-testid="admin-sidebar"]').waitFor({ state: "visible", timeout: 10_000 });
}
