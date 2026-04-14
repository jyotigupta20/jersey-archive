import { APIRequestContext } from "@playwright/test";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export interface TestJersey {
  id: string;
  team: string;
  sport: string;
}

/**
 * Create a minimal test jersey via the API.
 */
export async function createTestJersey(
  request: APIRequestContext,
  overrides: Partial<Record<string, unknown>> = {}
): Promise<TestJersey> {
  const res = await request.post("/api/jerseys", {
    headers: { "x-admin-password": ADMIN_PASSWORD },
    data: {
      team: "Test Team E2E",
      sport: "cricket",
      format: "IPL",
      season: "2099",
      jersey_type: "Home",
      ...overrides,
    },
  });
  if (!res.ok()) {
    throw new Error(`createTestJersey failed: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  return { id: body.id, team: body.team, sport: body.sport };
}

/**
 * Delete a test jersey via the API.
 */
export async function deleteTestJersey(
  request: APIRequestContext,
  id: string
): Promise<void> {
  await request.delete(`/api/jerseys/${id}`, {
    headers: { "x-admin-password": ADMIN_PASSWORD },
  });
}
