import { config } from "dotenv";
import { resolve } from "node:path";
import { test, expect, request as playwrightRequest } from "@playwright/test";

config({ path: resolve(process.cwd(), ".env") });

const apiUrl = process.env.E2E_API_URL;
const fixturePassword = process.env.E2E_FIXTURE_PASSWORD;
const schoolCode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A";
const principalEmail = "principal.a@phase1.example.com";
const studentEmail = "student.a@phase1.example.com";

async function login(request: any, email: string, password: string) {
  const response = await request.post("/api/v1/auth/login", {
    data: { email, password, schoolCode },
  });
  const body = await response.json().catch(() => ({}));
  expect(response.status(), JSON.stringify(body)).toBe(200);
  expect(body.user?.role).toBeDefined();
  return { token: body.accessToken ?? body.data?.accessToken, role: body.user?.role };
}

function auth(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

test.beforeAll(() => {
  expect(apiUrl, "E2E_API_URL is required").toBeTruthy();
  expect(fixturePassword, "E2E_FIXTURE_PASSWORD is required").toBeTruthy();
});

test.describe("Phase 6 Notices API isolation", () => {
  test("scheduled school notice stays hidden until publication", async () => {
    const principalApi = await playwrightRequest.newContext({ baseURL: apiUrl });
    const studentApi = await playwrightRequest.newContext({ baseURL: apiUrl });
    const principal = await login(principalApi, principalEmail, fixturePassword!);
    const student = await login(studentApi, studentEmail, fixturePassword!);
    expect(principal.role).toBe("principal");
    expect(student.role).toBe("student");

    const publishAt = new Date(Date.now() + 60_000).toISOString();
    const title = `Phase 6 Notice ${Date.now()}`;
    const create = await principalApi.post("/api/v1/notices", {
      data: {
        title,
        message: "Scheduled verification notice",
        audience: "school",
        priority: "high",
        publishAt,
      },
      ...auth(principal.token),
    });
    const createBody = await create.json().catch(() => ({}));
    expect(create.status(), JSON.stringify(createBody)).toBe(201);

    const before = await studentApi.get("/api/v1/notices?limit=100", auth(student.token));
    expect(before.status()).toBe(200);
    const beforeBody = await before.json();
    expect(beforeBody.data.some((notice: any) => notice.title === title)).toBe(false);
    await principalApi.dispose();
    await studentApi.dispose();
  });
});
