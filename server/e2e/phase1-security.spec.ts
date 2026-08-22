import { test, expect } from "@playwright/test";

const ids = {
  schoolAStudent: process.env.E2E_SCHOOL_A_STUDENT_ID,
  schoolBStudent: process.env.E2E_SCHOOL_B_STUDENT_ID,
};

const fixturePassword = process.env.E2E_FIXTURE_PASSWORD;
const schoolACode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A";
const emails = {
  principalA: "principal.a@phase1.example.com",
  teacherA: "teacher.a@phase1.example.com",
  studentA: "student.a@phase1.example.com",
  parentA: "parent.a@phase1.example.com",
};

async function login(request: any, email: string, schoolCode = schoolACode) {
  if (!fixturePassword) throw new Error("E2E_FIXTURE_PASSWORD is required");
  const response = await request.post("/api/v1/auth/login", {
    data: { email, password: fixturePassword, schoolCode },
  });
  const body = await response.json().catch(() => ({}));
  expect(response.status(), `Login failed for ${email}: ${JSON.stringify(body)}`).toBe(200);
  const token = body.accessToken ?? body.data?.accessToken;
  const refreshToken = body.refreshToken ?? body.data?.refreshToken;
  expect(token, `No access token returned for ${email}`).toBeTruthy();
  return { accessToken: token, refreshToken };
}

test.describe("Phase 1 tenant isolation and ownership", () => {
  test("school A student can read its own record", async ({ request }) => {
    const { accessToken } = await login(request, emails.studentA);
    const response = await request.get(`/api/v1/students/${ids.schoolAStudent}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(response.status()).toBe(200);
  });

  test("school A student cannot read school B record", async ({ request }) => {
    const { accessToken } = await login(request, emails.studentA);
    const response = await request.get(`/api/v1/students/${ids.schoolBStudent}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([403, 404]).toContain(response.status());
  });

  test("school A teacher cannot read a student outside its assigned class or tenant", async ({ request }) => {
    const { accessToken } = await login(request, emails.teacherA);
    const response = await request.get(`/api/v1/students/${ids.schoolBStudent}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([403, 404]).toContain(response.status());
  });

  test("school A principal cannot read school B fees", async ({ request }) => {
    const { accessToken } = await login(request, emails.principalA);
    const response = await request.get(`/api/v1/fees/student/${ids.schoolBStudent}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([403, 404]).toContain(response.status());
  });

  test("parent can access only a linked child", async ({ request }) => {
    const { accessToken } = await login(request, emails.parentA);
    const response = await request.get(`/api/v1/parents/children/${ids.schoolBStudent}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([403, 404]).toContain(response.status());
  });

  test("student cannot access teacher-only attendance management", async ({ request }) => {
    const { accessToken } = await login(request, emails.studentA);
    const response = await request.post("/api/v1/attendance", {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {},
    });
    expect(response.status()).toBe(403);
  });

  test("principal can read its tenant student without granting cross-tenant access", async ({ request }) => {
    const { accessToken } = await login(request, emails.principalA);
    const response = await request.get(`/api/v1/students/${ids.schoolAStudent}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(response.status()).toBe(200);
  });
});

test.describe("Phase 1 refresh-token rotation", () => {
  test("a refresh token is single-use after successful rotation", async ({ request }) => {
    const { refreshToken } = await login(request, emails.studentA);
    expect(refreshToken).toBeTruthy();

    const first = await request.post("/api/v1/auth/refresh", {
      data: { refreshToken },
    });
    expect(first.status()).toBe(200);

    const second = await request.post("/api/v1/auth/refresh", {
      data: { refreshToken },
    });
    expect([401, 403]).toContain(second.status());
  });
});
