import { test, expect } from "@playwright/test";

const apiUrl = process.env.E2E_API_URL;
const fixturePassword = process.env.E2E_FIXTURE_PASSWORD;
const schoolAStudent = process.env.E2E_SCHOOL_A_STUDENT_ID;
const schoolBStudent = process.env.E2E_SCHOOL_B_STUDENT_ID;
const schoolACode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A";
const cachedTokens: Record<string, string | undefined> = {
  "principal.a@phase1.example.com": process.env.E2E_PRINCIPAL_A_ACCESS_TOKEN,
  "student.a@phase1.example.com": process.env.E2E_STUDENT_A_ACCESS_TOKEN,
  "parent.a@phase1.example.com": process.env.E2E_PARENT_A_ACCESS_TOKEN,
};

const emails = {
  studentA: "student.a@phase1.example.com",
  parentA: "parent.a@phase1.example.com",
  principalA: "principal.a@phase1.example.com",
};

async function login(request: any, email: string) {
  const cached = cachedTokens[email];
  if (cached) return cached;
  const response = await request.post("/api/v1/auth/login", {
    data: { email, password: fixturePassword, schoolCode: schoolACode },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  return body.accessToken ?? body.data?.accessToken;
}

test.beforeAll(() => {
  expect(apiUrl, "E2E_API_URL is required").toBeTruthy();
  expect(fixturePassword, "E2E_FIXTURE_PASSWORD is required").toBeTruthy();
  expect(schoolAStudent, "E2E_SCHOOL_A_STUDENT_ID is required").toBeTruthy();
  expect(schoolBStudent, "E2E_SCHOOL_B_STUDENT_ID is required").toBeTruthy();
});

test.describe("Phase 2 payment ownership", () => {
  test("student cannot access another tenant's payment list", async ({ request }) => {
    const token = await login(request, emails.studentA);
    const response = await request.get(`/api/v1/fees/payments?studentId=${schoolBStudent}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([403, 404]).toContain(response.status());
  });

  test("parent cannot access payments for an unlinked child", async ({ request }) => {
    const token = await login(request, emails.parentA);
    const response = await request.get(`/api/v1/fees/payments?studentId=${schoolBStudent}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([403, 404]).toContain(response.status());
  });

  test("student cannot access another tenant's fee record through payments boundary", async ({ request }) => {
    const token = await login(request, emails.studentA);
    const response = await request.get(`/api/v1/fees/student/${schoolBStudent}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([403, 404]).toContain(response.status());
  });

  test("parent cannot access another tenant's fee record through payments boundary", async ({ request }) => {
    const token = await login(request, emails.parentA);
    const response = await request.get(`/api/v1/fees/student/${schoolBStudent}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([403, 404]).toContain(response.status());
  });

  test("principal remains able to read tenant payment data", async ({ request }) => {
    const token = await login(request, emails.principalA);
    const response = await request.get("/api/v1/fees/payments", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 404]).toContain(response.status());
  });
});
