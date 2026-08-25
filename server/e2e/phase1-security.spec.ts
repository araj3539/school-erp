import { test, expect, request as playwrightRequest } from "@playwright/test";

const ids = {
  schoolAStudent: process.env.E2E_SCHOOL_A_STUDENT_ID,
  schoolBStudent: process.env.E2E_SCHOOL_B_STUDENT_ID,
};

const fixturePassword = process.env.E2E_FIXTURE_PASSWORD;
const schoolACode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A";
const cachedTokens: Record<string, string | undefined> = {
  "principal.a@phase1.example.com": process.env.E2E_PRINCIPAL_A_ACCESS_TOKEN,
  "teacher.a@phase1.example.com": process.env.E2E_TEACHER_A_ACCESS_TOKEN,
  "student.a@phase1.example.com": process.env.E2E_STUDENT_A_ACCESS_TOKEN,
  "parent.a@phase1.example.com": process.env.E2E_PARENT_A_ACCESS_TOKEN,
};
const emails = {
  principalA: "principal.a@phase1.example.com",
  teacherA: "teacher.a@phase1.example.com",
  studentA: "student.a@phase1.example.com",
  parentA: "parent.a@phase1.example.com",
};

async function login(api: any, email: string, schoolCode = schoolACode) {
  const cached = cachedTokens[email];
  if (cached) {
    return {
      accessToken: cached,
      refreshToken: email === emails.studentA ? process.env.E2E_STUDENT_A_REFRESH_TOKEN : undefined,
    };
  }

  if (!fixturePassword) throw new Error("E2E_FIXTURE_PASSWORD is required");
  const response = await api.post("/api/v1/auth/login", {
    data: { email, password: fixturePassword, schoolCode },
  });
  const body = await response.json().catch(() => ({}));
  expect(response.status(), `Login failed for ${email}: ${JSON.stringify(body)}`).toBe(200);
  const token = body.accessToken ?? body.data?.accessToken;
  expect(token, `No access token returned for ${email}`).toBeTruthy();

  const refreshToken = response
    .headersArray()
    .filter((header) => header.name.toLowerCase() === "set-cookie")
    .map((header) => header.value)
    .map((value) => value.split(";")[0])
    .find((value) => value.startsWith("refresh_token="))
    ?.slice("refresh_token=".length);

  return { accessToken: token, refreshToken };
}

async function getWith502Retry(api: any, path: string, options: any, attempts = 3) {
  let response;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    response = await api.get(path, options);
    if (response.status() !== 502 || attempt === attempts) return response;
    await new Promise((resolve) => setTimeout(resolve, 750 * attempt));
  }
  return response!;
}

test.describe("Phase 1 tenant isolation and ownership", () => {
  test("school A student can read its own record", async ({ request }) => {
    const { accessToken } = await login(request, emails.studentA);
    const response = await getWith502Retry(request, `/api/v1/students/${ids.schoolAStudent}`, {
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
  test("a refresh token is single-use after successful rotation", async () => {
    const loginApi = await playwrightRequest.newContext({
      baseURL: process.env.E2E_API_URL,
      extraHTTPHeaders: { Accept: "application/json" },
    });
    const firstRefreshApi = await playwrightRequest.newContext({
      baseURL: process.env.E2E_API_URL,
      extraHTTPHeaders: { Accept: "application/json" },
    });
    const replayApi = await playwrightRequest.newContext({
      baseURL: process.env.E2E_API_URL,
      extraHTTPHeaders: { Accept: "application/json" },
    });

    try {
      const { refreshToken } = await login(loginApi, emails.studentA);
      expect(refreshToken).toBeTruthy();

      const first = await firstRefreshApi.post("/api/v1/auth/refresh", {
        data: { refreshToken },
      });
      expect(first.status()).toBe(200);

      const second = await replayApi.post("/api/v1/auth/refresh", {
        data: { refreshToken },
      });
      expect([401, 403]).toContain(second.status());
    } finally {
      await loginApi.dispose();
      await firstRefreshApi.dispose();
      await replayApi.dispose();
    }
  });
});
