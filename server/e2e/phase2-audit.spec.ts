import { test, expect } from "@playwright/test";

const apiUrl = process.env.E2E_API_URL;
const fixturePassword = process.env.E2E_FIXTURE_PASSWORD;
const schoolACode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A";

const emails = {
  principalA: "principal.a@phase1.example.com",
  studentA: "student.a@phase1.example.com",
};

async function login(request: any, email: string) {
  if (!apiUrl || !fixturePassword) {
    throw new Error("E2E_API_URL and E2E_FIXTURE_PASSWORD are required");
  }

  const response = await request.post("/api/v1/auth/login", {
    data: {
      email,
      password: fixturePassword,
      schoolCode: schoolACode,
    },
  });

  const body = await response.json().catch(() => ({}));
  expect(
    response.status(),
    `Login failed for ${email}: ${JSON.stringify(body)}`
  ).toBe(200);

  const token = body.accessToken ?? body.data?.accessToken;
  expect(token).toBeTruthy();
  return token;
}

test.describe("Phase 2 audit log isolation", () => {
  let principalToken: string;
  let studentToken: string;

  test.beforeAll(async ({ request }) => {
    principalToken = await login(request, emails.principalA);
    studentToken = await login(request, emails.studentA);
  });

  test("principal can read only tenant audit logs", async ({ request }) => {
    const response = await request.get("/api/v1/audit-logs?limit=20", {
      headers: { Authorization: `Bearer ${principalToken}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body).toHaveProperty("logs");
    for (const entry of body.logs ?? []) {
      expect(entry.schoolId?.toString()).not.toBe(
        "66b000000000000000000001"
      );
    }
  });

  test("student cannot read audit logs", async ({ request }) => {
    const response = await request.get("/api/v1/audit-logs", {
      headers: { Authorization: `Bearer ${studentToken}` },
    });

    expect(response.status()).toBe(403);
  });

  test("principal cannot influence tenant scope with a query parameter", async ({ request }) => {
    const response = await request.get(
      "/api/v1/audit-logs?schoolId=66b000000000000000000001&limit=20",
      {
        headers: { Authorization: `Bearer ${principalToken}` },
      }
    );

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body).toHaveProperty("logs");
    for (const entry of body.logs ?? []) {
      expect(entry.schoolId?.toString()).not.toBe(
        "66b000000000000000000001"
      );
    }
  });
});
