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
  const response = await request.post(apiUrl("/api/v1/auth/login"), { data: { email: "principal.a@phase1.example.com", password: fixturePassword, schoolCode: schoolACode } });
  const body = await response.json().catch(() => ({}));
  expect(response.status(), `Principal login failed: ${JSON.stringify(body)}`).toBe(200);
  return body.accessToken ?? body.data?.accessToken;
}

test("attendance monthly report rejects invalid months and accepts an academic-year month", async ({ request }) => {
  expect(studentId).toBeTruthy();
  const token = await getPrincipalToken(request);
  const headers = { Authorization: `Bearer ${token}` };
  const studentResponse = await request.get(apiUrl(`/api/v1/students/${studentId}`), { headers });
  const studentBody = await studentResponse.json().catch(() => ({}));
  expect(studentResponse.status()).toBe(200);
  const student = studentBody.student ?? studentBody.data?.student ?? studentBody.data ?? studentBody;
  const classId = typeof student.classId === "object" ? student.classId?._id : student.classId;
  const sectionId = typeof student.sectionId === "object" ? student.sectionId?._id : student.sectionId;
  expect(classId).toMatch(/^[a-f\d]{24}$/i);
  expect(sectionId).toMatch(/^[a-f\d]{24}$/i);

  const invalid = await request.get(apiUrl(`/api/v1/attendance/report/monthly?classId=${classId}&sectionId=${sectionId}&month=13&year=2026`), { headers });
  expect(invalid.status()).toBe(400);

  const valid = await request.get(apiUrl(`/api/v1/attendance/report/monthly?classId=${classId}&sectionId=${sectionId}&month=4&year=2026`), { headers });
  const validBody = await valid.json().catch(() => ({}));
  expect(valid.status(), `Monthly report failed: ${JSON.stringify(validBody)}`).toBe(200);
  expect(validBody).toBeTruthy();
});
