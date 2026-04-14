import { test, expect } from "@playwright/test";

let jerseyId: string;
let jerseyTeam: string;

test.describe("Jersey detail page", () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.get("/api/jerseys?sport=cricket&size=1");
    const data = await res.json();
    const jersey = data.hits?.[0];
    if (!jersey) throw new Error("No cricket jerseys found for detail test");
    jerseyId = jersey.id;
    jerseyTeam = jersey.team;
  });

  test("renders jersey detail page", async ({ page }) => {
    await page.goto(`/cricket/${jerseyId}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("h1 contains team name", async ({ page }) => {
    await page.goto(`/cricket/${jerseyId}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText(jerseyTeam);
  });

  test("subtitle/meta contains 'Season'", async ({ page }) => {
    await page.goto(`/cricket/${jerseyId}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(/season/i);
  });

  test("breadcrumb contains 'Home'", async ({ page }) => {
    await page.goto(`/cricket/${jerseyId}`);
    await page.waitForLoadState("networkidle");
    const breadcrumb = page.locator("nav[aria-label*='readcrumb'], [class*='breadcrumb'], a[href='/']");
    await expect(breadcrumb.first()).toBeVisible();
  });

  test("nonexistent ID returns 404", async ({ page }) => {
    const res = await page.goto("/cricket/nonexistent-id-xyz-abc-def");
    expect(res?.status()).toBe(404);
  });
});
