import { config } from "dotenv";
import { resolve } from "node:path";
import { test, expect } from "@playwright/test";

config({ path: resolve(process.cwd(), ".env") });

const apiUrl = process.env.E2E_API_URL;
const fixturePassword = process.env.E2E_FIXTURE_PASSWORD;
const studentToken = process.env.E2E_STUDENT_A_ACCESS_TOKEN;
const schoolCode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A";
const principalEmail = "principal.a@phase1.example.com";

async function login(request: any, email: string, password: string) {
  const response = await request.post("/api/v1/auth/login", {
    data: { email, password, schoolCode },
  });
  const body = await response.json().catch(() => ({}));
  expect(response.status(), JSON.stringify(body)).toBe(200);
  return body.accessToken ?? body.data?.accessToken;
}

function auth(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

test.beforeAll(() => {
  expect(apiUrl, "E2E_API_URL is required").toBeTruthy();
  expect(fixturePassword, "E2E_FIXTURE_PASSWORD is required").toBeTruthy();
  expect(studentToken, "E2E_STUDENT_A_ACCESS_TOKEN is required").toBeTruthy();
});

test.describe("Phase 6 Notices API isolation", () => {
  test("scheduled school notice stays hidden until publication", async ({ request }) => {
    const principalToken = await login(request, principalEmail, fixturePassword!);
    const publishAt = new Date(Date.now() + 60_000).toISOString();
    const title = `Phase 6 Notice ${Date.now()}`;

    const create = await request.post("/api/v1/notices", {
      data: {
        title,
        message: "Scheduled verification notice",
        audience: "school",
        priority: "high",
        publishAt,
      },
      ...auth(principalToken),
    });
    const createBody = await create.json().catch(() => ({}));
    expect(create.status(), JSON.stringify(createBody)).toBe(201);

    const before = await request.get("/api/v1/notices?limit=100", auth(studentToken!));
    expect(before.status()).toBe(200);
    const beforeBody = await before.json();
    expect(beforeBody.data.some((notice: any) => notice.title === title)).toBe(false);
  });
});
