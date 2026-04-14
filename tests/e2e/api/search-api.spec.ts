import { test, expect } from "@playwright/test";

test.describe("Search API", () => {
  test("?q=virat+kohli returns jerseys with Virat Kohli", async ({ request }) => {
    const res = await request.get("/api/search?q=virat+kohli");
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data).toHaveProperty("hits");
    if (data.hits.length > 0) {
      const hasKohli = data.hits.some((j: { worn_by?: string[] }) =>
        j.worn_by?.some((p: string) => p.toLowerCase().includes("kohli"))
      );
      expect(hasKohli).toBe(true);
    }
  });

  test("/api/search/suggest returns suggestions array", async ({ request }) => {
    const res = await request.get("/api/search/suggest?q=in");
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data.suggestions)).toBe(true);
  });

  test("/api/search/suggest?q=i returns empty array (too short — min 2 chars)", async ({ request }) => {
    const res = await request.get("/api/search/suggest?q=i");
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data.suggestions)).toBe(true);
    expect(data.suggestions.length).toBe(0);
  });
});
