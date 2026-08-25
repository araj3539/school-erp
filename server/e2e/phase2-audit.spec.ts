import { test, expect } from "@playwright/test";

const apiUrl = process.env.E2E_API_URL;
const fixturePassword = process.env.E2E_FIXTURE_PASSWORD;
const schoolCode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A";
const cachedTokens: Record<string, string | undefined> = {
  principalA: process.env.E2E_PRINCIPAL_A_ACCESS_TOKEN,
  studentA: process.env.E2E_STUDENT_A_ACCESS_TOKEN,
};

async function login(request: any, role: keyof typeof cachedTokens) {
  const cached = cachedTokens[role];
  if (cached) return cached;
  const email = role === "principalA" ? "principal.a@phase1.example.com" : "student.a@phase1.example.com";
  if (!apiUrl || !fixturePassword) throw new Error("E2E_API_URL and E2E_FIXTURE_PASSWORD are required");
  const response = await request.post("/api/v1/auth/login", {
    data: { email, password: fixturePassword, schoolCode },
  });
  const body = await response.json().catch(() => ({}));
  expect(response.status(), `Login failed for ${email}: ${JSON.stringify(body)}`).toBe(200);
  return body.accessToken ?? body.data?.accessToken;
}

test.describe("Phase 2 audit log isolation", () => {
  let principalToken: string;
  let studentToken: string;

  test.beforeAll(async ({ request }) => {
    principalToken = await login(request, "principalA");
    studentToken = await login(request, "studentA");
  });

  test("principal can read only tenant audit logs", async ({ request }) => {
    const response = await request.get("/api/v1/audit-logs?limit=20", {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("logs");
    for (const entry of body.logs ?? []) {
      expect(entry.schoolId?.toString()).not.toBe("66b000000000000000000001");
    }
  });

  test("student cannot read audit logs", async ({ request }) => {
    const response = await request.get("/api/v1/audit-logs", {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(response.status()).toBe(403);
  });

  test("principal cannot influence tenant scope with a query parameter", async ({ request }) => {
    const response = await request.get("/api/v1/audit-logs?schoolId=66b000000000000000000001&limit=20", {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("logs");
    for (const entry of body.logs ?? []) {
      expect(entry.schoolId?.toString()).not.toBe("66b000000000000000000001");
    }
  });
});
