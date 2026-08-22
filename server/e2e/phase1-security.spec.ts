import { test, expect } from "@playwright/test";

const ids = {
  schoolAStudent: process.env.E2E_SCHOOL_A_STUDENT_ID,
  schoolBStudent: process.env.E2E_SCHOOL_B_STUDENT_ID,
};
const tokens = {
  principalA: process.env.E2E_PRINCIPAL_A_TOKEN,
  teacherA: process.env.E2E_TEACHER_A_TOKEN,
  studentA: process.env.E2E_STUDENT_A_TOKEN,
  parentA: process.env.E2E_PARENT_A_TOKEN,
  refresh: process.env.E2E_REFRESH_TOKEN,
};

const configured = [
  ids.schoolAStudent,
  ids.schoolBStudent,
  tokens.principalA,
  tokens.teacherA,
  tokens.studentA,
  tokens.parentA,
].every(Boolean);

const refreshConfigured = Boolean(tokens.refresh);

test.describe("Phase 1 tenant isolation and ownership", () => {
  test.skip(!configured, "Set Phase 1 test tokens/IDs to run authenticated isolation checks");

  test("school A student can read its own record", async ({ request }) => {
    const response = await request.get(`/api/v1/students/${ids.schoolAStudent}`, {
      headers: { Authorization: `Bearer ${tokens.studentA}` },
    });
    expect(response.status()).toBe(200);
  });

  test("school A student cannot read school B record", async ({ request }) => {
    const response = await request.get(`/api/v1/students/${ids.schoolBStudent}`, {
      headers: { Authorization: `Bearer ${tokens.studentA}` },
    });
    expect([403, 404]).toContain(response.status());
  });

  test("school A teacher cannot read a student outside its assigned class or tenant", async ({ request }) => {
    const response = await request.get(`/api/v1/students/${ids.schoolBStudent}`, {
      headers: { Authorization: `Bearer ${tokens.teacherA}` },
    });
    expect([403, 404]).toContain(response.status());
  });

  test("school A principal cannot read school B fees", async ({ request }) => {
    const response = await request.get(`/api/v1/fees/student/${ids.schoolBStudent}`, {
      headers: { Authorization: `Bearer ${tokens.principalA}` },
    });
    expect([403, 404]).toContain(response.status());
  });

  test("parent can access only a linked child", async ({ request }) => {
    const response = await request.get(`/api/v1/parents/children/${ids.schoolBStudent}`, {
      headers: { Authorization: `Bearer ${tokens.parentA}` },
    });
    expect([403, 404]).toContain(response.status());
  });

  test("student cannot access teacher-only attendance management", async ({ request }) => {
    const response = await request.post("/api/v1/attendance", {
      headers: { Authorization: `Bearer ${tokens.studentA}` },
      data: {},
    });
    expect(response.status()).toBe(403);
  });

  test("principal can read its tenant student without granting cross-tenant access", async ({ request }) => {
    const response = await request.get(`/api/v1/students/${ids.schoolAStudent}`, {
      headers: { Authorization: `Bearer ${tokens.principalA}` },
    });
    expect(response.status()).toBe(200);
  });
});

test.describe("Phase 1 refresh-token rotation", () => {
  test.skip(!refreshConfigured, "Set E2E_REFRESH_TOKEN to run refresh replay verification");

  test("a refresh token is single-use after successful rotation", async ({ request }) => {
    const first = await request.post("/api/v1/auth/refresh", {
      data: { refreshToken: tokens.refresh },
    });
    expect(first.status()).toBe(200);

    const second = await request.post("/api/v1/auth/refresh", {
      data: { refreshToken: tokens.refresh },
    });
    expect([401, 403]).toContain(second.status());
  });
});
