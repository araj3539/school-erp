import { config } from "dotenv";
import { resolve } from "node:path";
import { test, expect, request as playwrightRequest } from "@playwright/test";

config({ path: resolve(process.cwd(), ".env") });

const apiUrl = process.env.E2E_API_URL;
const fixturePassword = process.env.E2E_FIXTURE_PASSWORD;
const schoolCode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A";
const studentId = process.env.E2E_SCHOOL_A_STUDENT_ID;
const principalEmail = "principal.a@phase1.example.com";
const studentEmail = "student.a@phase1.example.com";

async function login(request: any, email: string, password: string) {
  const response = await request.post("/api/v1/auth/login", { data: { email, password, schoolCode } });
  const body = await response.json().catch(() => ({}));
  expect(response.status(), JSON.stringify(body)).toBe(200);
  expect(body.user?.role).toBeDefined();
  return { token: body.accessToken ?? body.data?.accessToken, role: body.user?.role };
}

function auth(token: string) { return { headers: { Authorization: `Bearer ${token}` } }; }
function title(prefix: string) { return `Phase 6 ${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

async function createNotice(api: any, token: string, data: Record<string, unknown>) {
  const response = await api.post("/api/v1/notices", { data, ...auth(token) });
  const body = await response.json().catch(() => ({}));
  expect(response.status(), JSON.stringify(body)).toBe(201);
  return body.notice;
}

test.beforeAll(() => {
  expect(apiUrl, "E2E_API_URL is required").toBeTruthy();
  expect(fixturePassword, "E2E_FIXTURE_PASSWORD is required").toBeTruthy();
  expect(studentId, "E2E_SCHOOL_A_STUDENT_ID is required").toBeTruthy();
});

test.describe("Phase 6 Notices API isolation", () => {
  test("scheduled school notice stays hidden until publication", async () => {
    const principalApi = await playwrightRequest.newContext({ baseURL: apiUrl });
    const studentApi = await playwrightRequest.newContext({ baseURL: apiUrl });
    const principal = await login(principalApi, principalEmail, fixturePassword!);
    const student = await login(studentApi, studentEmail, fixturePassword!);
    expect(principal.role).toBe("principal"); expect(student.role).toBe("student");

    const scheduledTitle = title("scheduled");
    await createNotice(principalApi, principal.token, {
      title: scheduledTitle, message: "Scheduled verification notice", audience: "school", priority: "high",
      publishAt: new Date(Date.now() + 60_000).toISOString(),
    });
    const before = await studentApi.get("/api/v1/notices?limit=100", auth(student.token));
    expect(before.status()).toBe(200);
    expect((await before.json()).data.some((notice: any) => notice.title === scheduledTitle)).toBe(false);

    await principalApi.dispose(); await studentApi.dispose();
  });

  test("student receives matching class notices but not another class", async () => {
    const principalApi = await playwrightRequest.newContext({ baseURL: apiUrl });
    const studentApi = await playwrightRequest.newContext({ baseURL: apiUrl });
    const principal = await login(principalApi, principalEmail, fixturePassword!);
    const student = await login(studentApi, studentEmail, fixturePassword!);

    const studentResponse = await principalApi.get(`/api/v1/students/${studentId}`, auth(principal.token));
    const studentBody = await studentResponse.json();
    expect(studentResponse.status()).toBe(200);
    const studentRecord = studentBody.student ?? studentBody.data?.student ?? studentBody.data ?? studentBody;
    const classId = typeof studentRecord.classId === "object" ? studentRecord.classId?._id : studentRecord.classId;
    expect(classId).toMatch(/^[a-f\d]{24}$/i);

    const classesResponse = await principalApi.get("/api/v1/academics/classes?limit=100", auth(principal.token));
    const classesBody = await classesResponse.json();
    expect(classesResponse.status()).toBe(200);
    const otherClass = (classesBody.data ?? []).find((item: any) => item._id !== classId);
    test.skip(!otherClass?._id, "Fixture has only one class");

    const matchingTitle = title("matching-class");
    const otherTitle = title("other-class");
    await createNotice(principalApi, principal.token, { title: matchingTitle, message: "Matching class", audience: "class", classId });
    await createNotice(principalApi, principal.token, { title: otherTitle, message: "Other class", audience: "class", classId: otherClass._id });

    const response = await studentApi.get("/api/v1/notices?limit=100", auth(student.token));
    expect(response.status()).toBe(200);
    const titles = (await response.json()).data.map((notice: any) => notice.title);
    expect(titles).toContain(matchingTitle);
    expect(titles).not.toContain(otherTitle);

    const studentCreate = await studentApi.post("/api/v1/notices", { data: { title: title("student-write"), message: "Denied", audience: "school" }, ...auth(student.token) });
    expect(studentCreate.status()).toBe(403);
    await principalApi.dispose(); await studentApi.dispose();
  });
});
