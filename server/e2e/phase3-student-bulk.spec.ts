import { config } from "dotenv";
import { resolve } from "node:path";
import { test, expect } from "@playwright/test";
import writeExcelFile from "write-excel-file/node";
import readSheet from "read-excel-file/node";

config({ path: resolve(process.cwd(), ".env") });

const baseUrl = process.env.E2E_API_URL;
const fixturePassword = process.env.E2E_FIXTURE_PASSWORD;
const schoolACode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A";
const existingStudentId = process.env.E2E_SCHOOL_A_STUDENT_ID;

function apiUrl(path: string): string {
  expect(baseUrl, "E2E_API_URL is required").toBeTruthy();
  return new URL(path, baseUrl).toString();
}

async function getPrincipalToken(request: any): Promise<string> {
  const cached = process.env.E2E_PRINCIPAL_A_ACCESS_TOKEN;
  if (cached) return cached;
  expect(fixturePassword, "E2E_FIXTURE_PASSWORD is required").toBeTruthy();
  const response = await request.post(apiUrl("/api/v1/auth/login"), {
    data: { email: "principal.a@phase1.example.com", password: fixturePassword, schoolCode: schoolACode },
  });
  const body = await response.json().catch(() => ({}));
  expect(response.status(), `Principal login failed: ${JSON.stringify(body)}`).toBe(200);
  return body.accessToken ?? body.data?.accessToken;
}

async function excelBuffer(rows: unknown[][]): Promise<Buffer> {
  const buffer = await writeExcelFile(rows as any, { sheet: "Students" }).toBuffer();
  return Buffer.from(buffer);
}

test("invalid student import is rejected atomically and filtered export remains tenant-safe", async ({ request }) => {
  expect(existingStudentId).toBeTruthy();
  const token = await getPrincipalToken(request);
  const headers = { Authorization: `Bearer ${token}` };

  const existingResponse = await request.get(apiUrl(`/api/v1/students/${existingStudentId}`), { headers });
  const existingBody = await existingResponse.json().catch(() => ({}));
  expect(existingResponse.status(), `Fixture student lookup failed: ${JSON.stringify(existingBody)}`).toBe(200);
  const existing = existingBody.student ?? existingBody.data?.student ?? existingBody.data ?? existingBody;
  expect(existing?.admissionNo).toBeTruthy();

  const candidateAdmission = `E2E${Date.now().toString().slice(-10)}`;
  const invalidWorkbook = await excelBuffer([
    ["admissionNo", "firstName", "lastName", "dob", "gender", "fatherName", "motherName", "phone", "address", "admissionDate"],
    [candidateAdmission, "Atomic", "Candidate", "2012-01-15", "male", "Father", "Mother", "9876543210", "Test address", "2026-06-01"],
    [`${candidateAdmission}B`, "Broken", "Candidate", "2012-01-15", "invalid-gender", "Father", "Mother", "9876543211", "Test address", "2026-06-01"],
  ]);

  const invalidImport = await request.post(apiUrl("/api/v1/students/bulk-import"), {
    headers,
    multipart: { file: { name: "students.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: invalidWorkbook } },
  });
  const invalidBody = await invalidImport.json().catch(() => ({}));
  expect(invalidImport.status(), `Invalid import response: ${JSON.stringify(invalidBody)}`).toBe(400);
  expect(invalidBody.code).toBe("VALIDATION_ERROR");
  expect(invalidBody.errors?.length).toBeGreaterThan(0);

  const afterInvalid = await request.get(apiUrl(`/api/v1/students?search=${encodeURIComponent(candidateAdmission)}&page=1&limit=10`), { headers });
  const afterInvalidBody = await afterInvalid.json().catch(() => ({}));
  expect(afterInvalid.status()).toBe(200);
  expect(afterInvalidBody.data?.some((student: any) => student.admissionNo === candidateAdmission)).toBe(false);

  const existingAdmissionWorkbook = await excelBuffer([
    ["admissionNo", "firstName", "lastName", "dob", "gender", "fatherName", "motherName", "phone", "address", "admissionDate"],
    [existing.admissionNo, "Duplicate", "Admission", "2012-01-15", "male", "Father", "Mother", "9876543222", "Test address", "2026-06-01"],
  ]);
  const duplicateImport = await request.post(apiUrl("/api/v1/students/bulk-import"), {
    headers,
    multipart: { file: { name: "duplicate.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: existingAdmissionWorkbook } },
  });
  expect(duplicateImport.status()).toBe(400);

  const exportResponse = await request.get(apiUrl(`/api/v1/students/export?search=${encodeURIComponent(existing.admissionNo)}&status=${encodeURIComponent(existing.status)}&page=1&limit=10`), { headers });
  expect(exportResponse.status()).toBe(200);
  expect(exportResponse.headers()["content-type"]).toContain("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  const exportedRows = await readSheet(await exportResponse.body());
  expect(exportedRows.length).toBeGreaterThanOrEqual(2);
  expect(String(exportedRows[1][0])).toBe(existing.admissionNo);
});
