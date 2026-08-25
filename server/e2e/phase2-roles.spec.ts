import { test, expect, request as playwrightRequest } from "@playwright/test";

const apiUrl = process.env.E2E_API_URL;
const password = process.env.E2E_FIXTURE_PASSWORD;
const schoolCode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A";
const principalEmail = "principal.a@phase1.example.com";
const cachedPrincipalToken = process.env.E2E_PRINCIPAL_A_ACCESS_TOKEN;

async function login(request: any, email: string) {
  if (cachedPrincipalToken) return cachedPrincipalToken;
  if (!apiUrl || !password) throw new Error("E2E_API_URL and E2E_FIXTURE_PASSWORD are required");
  const response = await request.post("/api/v1/auth/login", {
    data: { email, password, schoolCode },
  });
  const body = await response.json().catch(() => ({}));
  expect(response.status(), JSON.stringify(body)).toBe(200);
  return body.accessToken ?? body.data?.accessToken;
}

function tokenUserId(token: string) {
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
  return payload.userId as string;
}

test.describe("Phase 2 role boundaries", () => {
  let api: any;
  let token: string;
  let userId: string;

  test.beforeAll(async () => {
    api = await playwrightRequest.newContext({ baseURL: apiUrl });
    token = await login(api, principalEmail);
    userId = tokenUserId(token);
  });

  test.afterAll(async () => {
    await api?.dispose();
  });

  test("principal cannot create another principal", async () => {
    const response = await api.post("/api/v1/auth/users", {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        email: `phase2-${Date.now()}@example.com`,
        password: "Phase2Role@2026!",
        role: "principal",
      },
    });
    expect([400, 403]).toContain(response.status());
  });

  test("principal cannot change their own role", async () => {
    const response = await api.put(`/api/v1/auth/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { role: "teacher" },
    });
    expect(response.status()).toBe(400);
  });
});
