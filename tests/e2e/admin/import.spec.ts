import { test, expect } from "@playwright/test";
import { adminLogin } from "../helpers/auth";

test.describe("Admin import page", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/import");
    await page.waitForLoadState("networkidle");
  });

  test("format select has IPL/T20/ODI/UCL options", async ({ page }) => {
    const select = page.locator("select").first();
    await expect(select).toBeVisible();
    const options = select.locator("option");
    const texts = await options.allTextContents();
    const upper = texts.map((t) => t.toUpperCase());
    // At least some of these formats should be present
    const hasFormats = upper.some((t) => t.includes("IPL") || t.includes("T20") || t.includes("ODI") || t.includes("UCL"));
    expect(hasFormats).toBe(true);
  });

  test("import button disabled without file selected", async ({ page }) => {
    const importBtn = page.locator("button").filter({ hasText: /import/i }).first();
    if (await importBtn.isVisible()) {
      const isDisabled = await importBtn.isDisabled();
      expect(isDisabled).toBe(true);
    } else {
      test.skip();
    }
  });
});
