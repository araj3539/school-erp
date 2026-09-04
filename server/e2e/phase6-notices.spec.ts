import { config } from "dotenv";
import { resolve } from "node:path";
import { test, expect } from "@playwright/test";

config({ path: resolve(process.cwd(), ".env") });

const apiUrl = process.env.E2E_API_URL;
const fixturePassword = process.env.E2E_FIXTURE_PASSWORD;
const schoolCode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A";
const studentId = process.env.E2E_SCHOOL_A_STUDENT_ID;
const principalEmail = "principal.a@phase1.example.com";
const studentEmail = "student.a@phase1.example.com";
let principalToken: string;
let studentToken: string;

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

test.beforeAll(async ({ request }) => {
  expect(apiUrl, "E2E_API_URL is required").toBeTruthy();
  expect(fixturePassword, "E2E_FIXTURE_PASSWORD is required").toBeTruthy();
  expect(studentId, "E2E_SCHOOL_A_STUDENT_ID is required").toBeTruthy();
  const principal = await login(request, principalEmail, fixturePassword!);
  const student = await login(request, studentEmail, fixturePassword!);
  principalToken = principal.token;
  studentToken = student.token;
  expect(principal.role).toBe("principal");
  expect(student.role).toBe("student");
});

test.describe("Phase 6 Notices API isolation", () => {
  test("scheduled and published school notices follow recipient visibility rules", async ({ request }) => {
    const scheduledTitle = title("scheduled");
    const publishedTitle = title("published");
    await createNotice(request, principalToken, {
      title: scheduledTitle, message: "Scheduled verification notice", audience: "school", priority: "high",
      publishAt: new Date(Date.now() + 60_000).toISOString(),
    });
    await createNotice(request, principalToken, {
      title: publishedTitle, message: "Published verification notice", audience: "school", priority: "normal",
      publishAt: new Date(Date.now() - 60_000).toISOString(),
    });

    const response = await request.get("/api/v1/notices?limit=100", auth(studentToken));
    expect(response.status()).toBe(200);
    const titles = (await response.json()).data.map((notice: any) => notice.title);
    expect(titles).not.toContain(scheduledTitle);
    expect(titles).toContain(publishedTitle);
  });

  test("student receives matching class notice and cannot create notices", async ({ request }) => {
    const studentResponse = await request.get(`/api/v1/students/${studentId}`, auth(principalToken));
    const studentBody = await studentResponse.json();
    expect(studentResponse.status()).toBe(200);
    const studentRecord = studentBody.student ?? studentBody.data?.student ?? studentBody.data ?? studentBody;
    const classId = typeof studentRecord.classId === "object" ? studentRecord.classId?._id : studentRecord.classId;
    expect(classId).toMatch(/^[a-f\d]{24}$/i);

    const matchingTitle = title("matching-class");
    await createNotice(request, principalToken, { title: matchingTitle, message: "Matching class", audience: "class", classId });
    const response = await request.get("/api/v1/notices?limit=100", auth(studentToken));
    expect(response.status()).toBe(200);
    const titles = (await response.json()).data.map((notice: any) => notice.title);
    expect(titles).toContain(matchingTitle);

    const studentCreate = await request.post("/api/v1/notices", { data: { title: title("student-write"), message: "Denied", audience: "school" }, ...auth(studentToken) });
    expect(studentCreate.status()).toBe(403);
  });
});
