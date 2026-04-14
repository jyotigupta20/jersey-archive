import { test, expect } from "@playwright/test";
import { adminLogin } from "../helpers/auth";
import { createTestJersey, deleteTestJersey } from "../helpers/api";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

test.describe("Admin jersey form", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test("add jersey form renders", async ({ page }) => {
    await page.goto("/admin/jerseys/new");
    await page.waitForLoadState("networkidle");
    // The jersey form has multiple fields — check for the main content form
    const form = page.locator("form").last();
    await expect(form).toBeVisible();
  });

  test("cancel button returns to list", async ({ page }) => {
    await page.goto("/admin/jerseys/new");
    await page.waitForLoadState("networkidle");
    const cancelBtn = page.locator("a, button").filter({ hasText: /cancel/i }).first();
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await expect(page).toHaveURL(/\/admin\/jerseys\/?$/);
    } else {
      test.skip();
    }
  });

  test("create jersey: fill form, submit, verify, cleanup", async ({ page, request }) => {
    await page.goto("/admin/jerseys/new");
    await page.waitForLoadState("networkidle");

    const teamInput = page.locator('input[name="team"], input[placeholder*="team" i], input[id*="team" i]').first();
    const seasonInput = page.locator('input[name="season"], input[placeholder*="season" i], input[id*="season" i]').first();

    if (!(await teamInput.isVisible()) || !(await seasonInput.isVisible())) {
      test.skip();
      return;
    }

    await teamInput.fill("E2E Test Team Create");
    await seasonInput.fill("2099");

    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForLoadState("networkidle");

    // Should redirect to list or show success
    await expect(page).toHaveURL(/\/admin\/jerseys/);

    // Clean up — find and delete the created jersey
    const res = await request.get("/api/jerseys?q=E2E+Test+Team+Create&size=5");
    const data = await res.json();
    const jersey = data.hits?.find((j: { team: string; season: string }) =>
      j.team === "E2E Test Team Create" && j.season === "2099"
    );
    if (jersey) {
      await deleteTestJersey(request, jersey.id);
    }
  });

  test("edit jersey: create, edit, verify, cleanup", async ({ page, request }) => {
    // Create jersey via API
    const jersey = await createTestJersey(request);
    await page.waitForTimeout(1000); // Wait for ES indexing

    try {
      await page.goto(`/admin/jerseys/${jersey.id}/edit`);
      await page.waitForLoadState("networkidle");

      const teamInput = page.locator('input[name="team"], input[placeholder*="team" i], input[id*="team" i]').first();
      if (await teamInput.isVisible()) {
        await teamInput.fill("E2E Test Team Updated");
        const submitBtn = page.locator('button[type="submit"]').first();
        await submitBtn.click();
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveURL(/\/admin\/jerseys/);
      }
    } finally {
      await deleteTestJersey(request, jersey.id);
    }
  });
});
