import { test, expect } from "@playwright/test";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

test.describe("Jerseys API", () => {
  test("GET /api/jerseys returns expected shape", async ({ request }) => {
    const res = await request.get("/api/jerseys");
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data).toHaveProperty("hits");
    expect(data).toHaveProperty("total");
    expect(data).toHaveProperty("aggregations");
  });

  test("total is >= 300", async ({ request }) => {
    const res = await request.get("/api/jerseys?size=1");
    const data = await res.json();
    expect(data.total).toBeGreaterThanOrEqual(300);
  });

  test("?size=5 returns 5 hits", async ({ request }) => {
    const res = await request.get("/api/jerseys?size=5");
    const data = await res.json();
    expect(data.hits.length).toBe(5);
  });

  test("?sport=cricket returns only cricket jerseys", async ({ request }) => {
    const res = await request.get("/api/jerseys?sport=cricket&size=10");
    const data = await res.json();
    for (const jersey of data.hits) {
      expect(jersey.sport).toBe("cricket");
    }
  });

  test("POST without auth returns 401", async ({ request }) => {
    const res = await request.post("/api/jerseys", {
      data: { team: "Test", sport: "cricket", season: "2099" },
    });
    expect(res.status()).toBe(401);
  });

  test("POST with auth creates jersey (201) and cleanup", async ({ request }) => {
    const res = await request.post("/api/jerseys", {
      headers: { "x-admin-password": ADMIN_PASSWORD },
      data: {
        team: "API Test Team",
        sport: "cricket",
        format: "IPL",
        season: "2099",
        jersey_type: "Home",
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.id).toBeTruthy();

    // Cleanup
    await request.delete(`/api/jerseys/${body.id}`, {
      headers: { "x-admin-password": ADMIN_PASSWORD },
    });
  });

  test("GET /api/jerseys/[id] returns 200 for existing jersey", async ({ request }) => {
    const listRes = await request.get("/api/jerseys?size=1");
    const listData = await listRes.json();
    const id = listData.hits[0]?.id;
    expect(id).toBeTruthy();

    const res = await request.get(`/api/jerseys/${id}`);
    expect(res.status()).toBe(200);
  });

  test("GET /api/jerseys/[id] returns 404 for unknown id", async ({ request }) => {
    const res = await request.get("/api/jerseys/nonexistent-id-xyz-abc-000");
    expect(res.status()).toBe(404);
  });

  test("DELETE without auth returns 401", async ({ request }) => {
    const res = await request.delete("/api/jerseys/some-id", {});
    expect(res.status()).toBe(401);
  });

  test("DELETE with auth returns success", async ({ request }) => {
    // Create a jersey first
    const createRes = await request.post("/api/jerseys", {
      headers: { "x-admin-password": ADMIN_PASSWORD },
      data: { team: "Delete Test", sport: "cricket", season: "2099" },
    });
    const { id } = await createRes.json();

    const deleteRes = await request.delete(`/api/jerseys/${id}`, {
      headers: { "x-admin-password": ADMIN_PASSWORD },
    });
    expect(deleteRes.ok()).toBe(true);
    const data = await deleteRes.json();
    expect(data.success).toBe(true);
  });
});
