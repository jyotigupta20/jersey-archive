import { test } from "@playwright/test";
import { runLighthouse } from "./lighthouse";

const BASE_URL = "http://localhost:3000";

// Performance threshold is 20 — dev server (unoptimised) typically scores 25-35.
// Accessibility, best-practices, and SEO are the meaningful gates.
test.describe("Lighthouse quality audits", () => {
  test.setTimeout(120_000);

  test("Homepage / meets quality thresholds", async () => {
    await runLighthouse(`${BASE_URL}/`, {
      accessibility: 80,
      "best-practices": 80,
      seo: 70,
      performance: 20,
    });
  });

  test("Explore /explore meets quality thresholds", async () => {
    await runLighthouse(`${BASE_URL}/explore`, {
      accessibility: 80,
      "best-practices": 75,
      seo: 70,
      performance: 20,
    });
  });

  test("Search /search?q=india meets quality thresholds", async () => {
    await runLighthouse(`${BASE_URL}/search?q=india`, {
      accessibility: 80,
      "best-practices": 75,
      seo: 60,
      performance: 20,
    });
  });

  test("Jersey detail /cricket/[id] meets quality thresholds", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/jerseys?sport=cricket&size=1`);
    const data = await res.json();
    const id = data.hits?.[0]?.id;
    if (!id) {
      console.warn("No cricket jersey found for Lighthouse test — skipping");
      return;
    }
    await runLighthouse(`${BASE_URL}/cricket/${id}`, {
      accessibility: 80,
      "best-practices": 75,
      seo: 70,
      performance: 20,
    });
  });
});
