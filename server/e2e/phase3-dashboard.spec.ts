import { config } from "dotenv";
import { resolve } from "node:path";
import { test, expect } from "@playwright/test";

config({ path: resolve(process.cwd(), ".env") });

const baseUrl = process.env.E2E_API_URL;
const fixturePassword = process.env.E2E_FIXTURE_PASSWORD;
const schoolACode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A";

function apiUrl(path: string): string {
  expect(baseUrl, "E2E_API_URL is required").toBeTruthy();
  return new URL(path, baseUrl).toString();
}

async function getPrincipalToken(request: any): Promise<string> {
  const cached = process.env.E2E_PRINCIPAL_A_ACCESS_TOKEN;
  if (cached) return cached;
  expect(fixturePassword, "E2E_FIXTURE_PASSWORD is required").toBeTruthy();
  const response = await request.post(apiUrl("/api/v1/auth/login"), {
    data: { email: "principal.a@phase1.example.com", password: fixturePassword, schoolCode: schoolACode },
  });
  const body = await response.json().catch(() => ({}));
  expect(response.status(), `Principal login failed: ${JSON.stringify(body)}`).toBe(200);
  return body.accessToken ?? body.data?.accessToken;
}

function assertConsecutiveDates(values: Array<{ date: string }>, expectedLength: number) {
  expect(values).toHaveLength(expectedLength);
  for (const value of values) expect(value.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  for (let i = 1; i < values.length; i++) {
    const previous = new Date(`${values[i - 1].date}T00:00:00.000Z`);
    const current = new Date(`${values[i].date}T00:00:00.000Z`);
    expect(current.getTime() - previous.getTime()).toBe(24 * 60 * 60 * 1000);
  }
}

test("dashboard charts return bounded, tenant-scoped trend series", async ({ request }) => {
  const token = await getPrincipalToken(request);
  const response = await request.get(apiUrl("/api/v1/dashboard/charts"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => ({}));
  expect(response.status(), `Dashboard charts failed: ${JSON.stringify(body)}`).toBe(200);

  expect(Array.isArray(body.attendanceTrend)).toBe(true);
  expect(Array.isArray(body.collectionTrend)).toBe(true);
  expect(Array.isArray(body.feeStatus)).toBe(true);

  assertConsecutiveDates(body.attendanceTrend, 7);
  assertConsecutiveDates(body.collectionTrend, 30);

  for (const point of body.attendanceTrend) {
    expect(point.present).toBeGreaterThanOrEqual(0);
    expect(point.total).toBeGreaterThanOrEqual(point.present);
    expect(point.rate).toBeGreaterThanOrEqual(0);
    expect(point.rate).toBeLessThanOrEqual(100);
  }
  for (const point of body.collectionTrend) expect(point.total).toBeGreaterThanOrEqual(0);
});
