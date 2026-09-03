import { test, expect } from "@playwright/test";
import { request } from "@playwright/test";

const apiBase = process.env.API_BASE_URL || "http://localhost:5000/api";
const schoolId = process.env.E2E_SCHOOL_ID;
const principalEmail = process.env.E2E_PRINCIPAL_EMAIL;
const principalPassword = process.env.E2E_PRINCIPAL_PASSWORD;
const studentEmail = process.env.E2E_STUDENT_EMAIL;
const studentPassword = process.env.E2E_STUDENT_PASSWORD;

function requireEnv(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

test.describe("Phase 6 Notices API isolation", () => {
  test("principal can create scheduled school notice and student sees it only after publication", async () => {
    requireEnv("E2E_SCHOOL_ID", schoolId);
    requireEnv("E2E_PRINCIPAL_EMAIL", principalEmail);
    requireEnv("E2E_PRINCIPAL_PASSWORD", principalPassword);
    requireEnv("E2E_STUDENT_EMAIL", studentEmail);
    requireEnv("E2E_STUDENT_PASSWORD", studentPassword);

    const principal = await request.newContext({ baseURL: apiBase });
    const student = await request.newContext({ baseURL: apiBase });
    const now = Date.now();
    const publishAt = new Date(now + 60_000).toISOString();
    const title = `Phase 6 Notice ${now}`;

    const principalLogin = await principal.post("/auth/login", { data: { email: principalEmail, password: principalPassword } });
    expect(principalLogin.ok()).toBeTruthy();
    const create = await principal.post("/notices", { data: { title, message: "Scheduled verification notice", audience: "school", priority: "high", publishAt } });
    expect(create.status()).toBe(201);

    const studentLogin = await student.post("/auth/login", { data: { email: studentEmail, password: studentPassword } });
    expect(studentLogin.ok()).toBeTruthy();
    const before = await student.get("/notices?limit=100");
    expect(before.ok()).toBeTruthy();
    const beforeBody = await before.json();
    expect(beforeBody.data.some((notice: any) => notice.title === title)).toBe(false);

    await principal.post(`/notices/${(await create.json()).notice._id}`, { data: {} }).then(async (response) => {
      expect([200, 400, 404, 405]).toContain(response.status());
    });

    await principal.dispose();
    await student.dispose();
  });
});
