import { config } from "dotenv";
import { resolve } from "node:path";
import { test, expect } from "@playwright/test";

config({ path: resolve(process.cwd(), ".env") });

const baseUrl = process.env.E2E_API_URL;
const fixturePassword = process.env.E2E_FIXTURE_PASSWORD;
const schoolACode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A";
const studentId = process.env.E2E_SCHOOL_A_STUDENT_ID;

function apiUrl(path: string): string {
  expect(baseUrl, "E2E_API_URL is required").toBeTruthy();
  return new URL(path, baseUrl).toString();
}

async function getPrincipalToken(request: any): Promise<string> {
  const cached = process.env.E2E_PRINCIPAL_A_ACCESS_TOKEN;
  if (cached) return cached;
  expect(fixturePassword, "E2E_FIXTURE_PASSWORD is required").toBeTruthy();
  const response = await request.post(apiUrl("/api/v1/auth/login"), {
    data: {
      email: "principal.a@phase1.example.com",
      password: fixturePassword,
      schoolCode: schoolACode,
    },
  });
  const body = await response.json().catch(() => ({}));
  expect(response.status(), `Principal login failed: ${JSON.stringify(body)}`).toBe(200);
  return body.accessToken ?? body.data?.accessToken;
}

test("principal student list honors search, status, class filter and pagination", async ({ request }) => {
  expect(studentId).toBeTruthy();
  const token = await getPrincipalToken(request);
  const headers = { Authorization: `Bearer ${token}` };

  const studentResponse = await request.get(apiUrl(`/api/v1/students/${studentId}`), { headers });
  const studentBody = await studentResponse.json().catch(() => ({}));
  expect(studentResponse.status(), `Student lookup failed: ${JSON.stringify(studentBody)}`).toBe(200);
  const student = studentBody.student ?? studentBody.data?.student ?? studentBody.data ?? studentBody;
  const admissionNo = student.admissionNo;
  const classId = typeof student.classId === "object" ? student.classId?._id : student.classId;

  expect(admissionNo).toBeTruthy();
  expect(classId).toMatch(/^[a-f\d]{24}$/i);

  const searchResponse = await request.get(apiUrl(`/api/v1/students?search=${encodeURIComponent(admissionNo)}&status=active&page=1&limit=10`), { headers });
  const searchBody = await searchResponse.json().catch(() => ({}));
  expect(searchResponse.status(), `Search failed: ${JSON.stringify(searchBody)}`).toBe(200);
  expect(searchBody.pagination?.page).toBe(1);
  expect(searchBody.pagination?.limit).toBe(10);
  expect(searchBody.data).toEqual(expect.any(Array));
  expect(searchBody.data.some((item: any) => item._id === studentId)).toBe(true);

  const classResponse = await request.get(apiUrl(`/api/v1/students?classId=${classId}&status=active&page=1&limit=5`), { headers });
  const classBody = await classResponse.json().catch(() => ({}));
  expect(classResponse.status(), `Class filter failed: ${JSON.stringify(classBody)}`).toBe(200);
  for (const item of classBody.data ?? []) {
    const itemClassId = typeof item.classId === "object" ? item.classId?._id : item.classId;
    expect(itemClassId).toBe(classId);
    expect(item.status).toBe("active");
  }
});
