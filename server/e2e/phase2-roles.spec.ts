import { test, expect } from "@playwright/test";

const apiUrl = process.env.E2E_API_URL;
const password = process.env.E2E_FIXTURE_PASSWORD;
const schoolCode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A";
const principalEmail = "principal.a@phase1.example.com";

async function login(request: any, email: string) {
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
  test("principal cannot create another principal", async ({ request }) => {
    const token = await login(request, principalEmail);
    const response = await request.post("/api/v1/auth/users", {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        email: `phase2-${Date.now()}@example.com`,
        password: "Phase2Role@2026!",
        role: "principal",
      },
    });
    expect(response.status()).toBe(403);
  });

  test("principal cannot change their own role", async ({ request }) => {
    const token = await login(request, principalEmail);
    const userId = tokenUserId(token);
    const response = await request.put(`/api/v1/auth/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { role: "teacher" },
    });
    expect(response.status()).toBe(400);
  });
});
