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

test("principal teacher administration honors search, status, pagination and tenant ownership", async ({ request }) => {
  const token = await getPrincipalToken(request);
  const headers = { Authorization: `Bearer ${token}` };

  const response = await request.get(apiUrl("/api/v1/teachers?search=teacher.a%40phase1.example.com&status=active&page=1&limit=10"), { headers });
  const body = await response.json().catch(() => ({}));
  expect(response.status(), `Teacher list failed: ${JSON.stringify(body)}`).toBe(200);
  expect(body.pagination?.page).toBe(1);
  expect(body.pagination?.limit).toBe(10);
  expect(body.data).toEqual(expect.any(Array));
  expect(body.data.some((teacher: any) => teacher.email === "teacher.a@phase1.example.com")).toBe(true);
  for (const teacher of body.data) expect(teacher.schoolId).toBeTruthy();

  const missingResponse = await request.get(apiUrl("/api/v1/teachers/000000000000000000000000"), { headers });
  expect(missingResponse.status()).toBe(404);
});
