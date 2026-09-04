import { config } from "dotenv";
import { resolve } from "node:path";
import { test, expect } from "@playwright/test";
config({ path: resolve(process.cwd(), ".env") });
const apiUrl = process.env.E2E_API_URL;
const fixturePassword = process.env.E2E_FIXTURE_PASSWORD;
const schoolCode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A";
const principalEmail = "principal.a@phase1.example.com";
let fixtureToken: string;

async function login(request: any) {
  const response = await request.post("/api/v1/auth/login", { data: { email: principalEmail, password: fixturePassword, schoolCode } });
  const body = await response.json().catch(() => ({}));
  expect(response.status(), JSON.stringify(body)).toBe(200);
  return body.accessToken ?? body.data?.accessToken;
}
function auth(token: string) { return { headers: { Authorization: `Bearer ${token}` } }; }

test.beforeAll(async ({ request }) => {
  expect(apiUrl, "E2E_API_URL is required").toBeTruthy();
  expect(fixturePassword, "E2E_FIXTURE_PASSWORD is required").toBeTruthy();
  fixtureToken = await login(request);
  expect(fixtureToken).toBeTruthy();
});

test.describe("Phase 5 exams/results acceptance", () => {
  test("exam API is tenant-scoped and returns the expected collection shape", async ({ request }) => {
    const r = await request.get("/api/v1/exams?limit=20", auth(fixtureToken));
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(body).toEqual(expect.objectContaining({ data: expect.any(Array), pagination: expect.objectContaining({ page: expect.any(Number), limit: expect.any(Number), total: expect.any(Number), totalPages: expect.any(Number) }) }));
  });

  test("published result list and report-card route are non-destructive", async ({ request }) => {
    const exams = await request.get("/api/v1/exams?status=published&limit=20", auth(fixtureToken));
    expect(exams.status()).toBe(200);
    const examBody = await exams.json();
    const published = examBody.data?.[0];
    test.skip(!published?._id, "Fixture has no published exam");
    const results = await request.get(`/api/v1/exams/results/list?examId=${published._id}&limit=1`, auth(fixtureToken));
    expect(results.status()).toBe(200);
    const resultBody = await results.json();
    const result = resultBody.data?.[0];
    test.skip(!result?._id, "Fixture has no published result");
    const report = await request.get(`/api/v1/exams/results/${result._id}/report-card`, auth(fixtureToken));
    expect(report.status()).toBe(200);
    expect(report.headers()["content-type"]).toContain("application/pdf");
    expect((await report.body()).subarray(0, 4).toString()).toBe("%PDF");
  });
});
