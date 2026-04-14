import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { outputFolder: "playwright-report" }]],
  use: {
    baseURL: "http://localhost:3000",
    navigationTimeout: 15_000,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "e2e",
      testMatch: "tests/e2e/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "quality",
      testMatch: "tests/quality/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
