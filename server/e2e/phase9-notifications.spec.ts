import { config } from "dotenv";
import { resolve } from "node:path";
import { test, expect } from "@playwright/test";

config({ path: resolve(process.cwd(), ".env") });

const apiUrl = process.env.E2E_API_URL;
const fixturePassword = process.env.E2E_FIXTURE_PASSWORD;
const schoolCode = process.env.E2E_SCHOOL_A_CODE || "SCH-E2E-A";
const principalEmail = "principal.e2e.a@example.com";
const studentEmail = "student.e2e.a1@example.com";
const principalBEmail = "principal.e2e.b@example.com";
let principalToken: string;
let studentToken: string;
let principalBToken: string;

async function login(request: any, email: string, code = schoolCode) {
  const response = await request.post("/api/v1/auth/login", { data: { email, password: fixturePassword, schoolCode: code } });
  const body = await response.json().catch(() => ({}));
  expect(response.status(), JSON.stringify(body)).toBe(200);
  return body.accessToken ?? body.data?.accessToken;
}
function auth(token: string) { return { headers: { Authorization: `Bearer ${token}` } }; }
function title(prefix: string) { return `Phase 9 ${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

async function waitForNotification(request: any, titleValue: string) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await request.get("/api/v1/notifications?limit=100", auth(studentToken));
    expect(response.status()).toBe(200);
    const body = await response.json();
    const notification = body.data?.find((item: any) => item.title === titleValue);
    if (notification) return notification;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
  }
  return null;
}

test.beforeAll(async ({ request }) => {
  expect(apiUrl, "E2E_API_URL is required").toBeTruthy();
  expect(fixturePassword, "E2E_FIXTURE_PASSWORD is required").toBeTruthy();
  principalToken = await login(request, principalEmail);
  studentToken = await login(request, studentEmail);
  principalBToken = await login(request, principalBEmail, "SCH-E2E-B");
});

test.describe("Phase 9 notification security", () => {
  test("published notice reaches the student, supports unread filtering, and can be marked read", async ({ request }) => {
    const noticeTitle = title("notification");
    const createResponse = await request.post("/api/v1/notices", {
      data: { title: noticeTitle, message: "Notification E2E", audience: "school", priority: "normal", publishAt: new Date(Date.now() - 60_000).toISOString() },
      ...auth(principalToken),
    });
    expect(createResponse.status()).toBe(201);

    const notification = await waitForNotification(request, noticeTitle);
    expect(notification).toBeTruthy();
    expect(notification?.readAt).toBeUndefined();

    const unreadResponse = await request.get("/api/v1/notifications?unreadOnly=true&limit=100", auth(studentToken));
    expect(unreadResponse.status()).toBe(200);
    expect((await unreadResponse.json()).data.some((item: any) => item.title === noticeTitle)).toBe(true);

    const readResponse = await request.patch(`/api/v1/notifications/${notification._id}/read`, auth(studentToken));
    expect(readResponse.status()).toBe(200);
    expect((await readResponse.json()).notification.readAt).toBeTruthy();

    const afterRead = await request.get("/api/v1/notifications?unreadOnly=true&limit=100", auth(studentToken));
    expect(afterRead.status()).toBe(200);
    expect((await afterRead.json()).data.some((item: any) => item.title === noticeTitle)).toBe(false);
  });

  test("notification preferences suppress in-app delivery when in_app is disabled", async ({ request }) => {
    const preference = await request.put("/api/v1/notifications/preferences", {
      data: { category: "announcement", channels: ["email"] },
      ...auth(studentToken),
    });
    expect(preference.status()).toBe(200);

    const noticeTitle = title("preference-suppressed");
    const createResponse = await request.post("/api/v1/notices", {
      data: { title: noticeTitle, message: "Preference E2E", audience: "school", priority: "normal", publishAt: new Date(Date.now() - 60_000).toISOString() },
      ...auth(principalToken),
    });
    expect(createResponse.status()).toBe(201);

    await new Promise((resolvePromise) => setTimeout(resolvePromise, 1500));
    const notifications = await request.get("/api/v1/notifications?limit=100", auth(studentToken));
    expect(notifications.status()).toBe(200);
    expect((await notifications.json()).data.some((item: any) => item.title === noticeTitle)).toBe(false);
  });

  test("delivery diagnostics are tenant-scoped and unavailable to students", async ({ request }) => {
    const principalResponse = await request.get("/api/v1/notifications/delivery-attempts?limit=10", auth(principalToken));
    expect(principalResponse.status()).toBe(200);
    const principalBody = await principalResponse.json();
    expect(principalBody.pagination).toBeDefined();
    expect(principalBody.data.every((item: any) => item.schoolId === "67e000000000000000000001")).toBe(true);

    const otherTenantResponse = await request.get("/api/v1/notifications/delivery-attempts?limit=10", auth(principalBToken));
    expect(otherTenantResponse.status()).toBe(200);
    const otherTenantBody = await otherTenantResponse.json();
    expect(otherTenantBody.pagination).toBeDefined();
    expect(otherTenantBody.data).toHaveLength(0);

    const studentResponse = await request.get("/api/v1/notifications/delivery-attempts?limit=10", auth(studentToken));
    expect(studentResponse.status()).toBe(403);
  });
});
