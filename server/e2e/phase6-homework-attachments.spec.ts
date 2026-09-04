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
const schoolId = "66a000000000000000000001";
let principalToken: string;
let studentToken: string;

function normalizeObjectId(value: unknown): string | undefined {
  if (typeof value === "string" && /^[a-f\d]{24}$/i.test(value)) return value;
  if (value && typeof value === "object" && "_id" in value) return normalizeObjectId((value as { _id?: unknown })._id);
  return undefined;
}
async function login(api: any, email: string) {
  const response = await api.post("/api/v1/auth/login", { data: { email, password: fixturePassword, schoolCode } });
  const body = await response.json().catch(() => ({}));
  expect(response.status(), JSON.stringify(body)).toBe(200);
  return { token: body.accessToken ?? body.data?.accessToken, role: body.user?.role };
}
function auth(token: string) { return { headers: { Authorization: `Bearer ${token}` } }; }
function title() { return `Phase 6 attachment ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

async function getStudentTarget(api: any, token: string) {
  const studentResponse = await api.get(`/api/v1/students/${studentId}`, auth(token));
  const body = await studentResponse.json();
  expect(studentResponse.status(), JSON.stringify(body)).toBe(200);
  const student = body.student ?? body.data?.student ?? body.data ?? body;
  const classId = normalizeObjectId(student.classId);
  const sectionId = normalizeObjectId(student.sectionId);
  expect(classId).toBeTruthy();

  const subjectsResponse = await api.get(`/api/v1/academics/subjects?classId=${classId}&limit=100`, auth(token));
  const subjectsBody = await subjectsResponse.json();
  expect(subjectsResponse.status(), JSON.stringify(subjectsBody)).toBe(200);
  let subject = (subjectsBody.data ?? subjectsBody.subjects ?? subjectsBody).find((item: any) => (normalizeObjectId(item.classIds?.[0]) === classId));
  let createdSubjectId: string | undefined;
  if (!subject) {
    const code = `HW${Date.now().toString().slice(-6)}`;
    const createSubject = await api.post("/api/v1/academics/subjects", { data: { name: "Homework Verification", code, classIds: [classId] }, ...auth(token) });
    const createBody = await createSubject.json().catch(() => ({}));
    expect(createSubject.status(), JSON.stringify(createBody)).toBe(201);
    subject = createBody.subject ?? createBody.data?.subject ?? createBody.data;
    createdSubjectId = normalizeObjectId(subject?._id);
  }
  const subjectId = normalizeObjectId(subject?._id);
  expect(subjectId).toBeTruthy();

  const yearsResponse = await api.get("/api/v1/academic-years?limit=100", auth(token));
  const yearsBody = await yearsResponse.json();
  expect(yearsResponse.status(), JSON.stringify(yearsBody)).toBe(200);
  const years = yearsBody.data ?? yearsBody.academicYears ?? [];
  const year = years.find((item: any) => item.isCurrent && normalizeObjectId(item.schoolId) === schoolId) ?? years.find((item: any) => normalizeObjectId(item.schoolId) === schoolId);
  expect(year?._id).toBeTruthy();
  return { classId, sectionId, subjectId: subjectId!, academicYearId: normalizeObjectId(year._id)!, createdSubjectId };
}

test.beforeAll(async ({ request }) => {
  expect(apiUrl, "E2E_API_URL is required").toBeTruthy();
  expect(fixturePassword, "E2E_FIXTURE_PASSWORD is required").toBeTruthy();
  expect(studentId, "E2E_SCHOOL_A_STUDENT_ID is required").toBeTruthy();
  const principal = await login(request, principalEmail);
  const student = await login(request, studentEmail);
  principalToken = principal.token;
  studentToken = student.token;
  expect(principal.role).toBe("principal"); expect(student.role).toBe("student");
});

test.describe("Phase 6 Homework private attachments", () => {
  test("stores attachment privately and returns signed access only to authorized recipients", async () => {
    const principalApi = await playwrightRequest.newContext({ baseURL: apiUrl });
    const studentApi = await playwrightRequest.newContext({ baseURL: apiUrl });

    const target = await getStudentTarget(principalApi, principalToken);
    const homeworkResponse = await principalApi.post("/api/v1/homework", { data: { title: title(), description: "Private attachment verification", ...target, assignedDate: "2026-09-03", dueDate: "2026-09-05" }, ...auth(principalToken) });
    const homeworkBody = await homeworkResponse.json();
    expect(homeworkResponse.status(), JSON.stringify(homeworkBody)).toBe(201);
    const homework = homeworkBody.homework;

    const uploadResponse = await principalApi.post(`/api/v1/homework/${homework._id}/attachments`, { multipart: { file: { name: "worksheet.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7\nprivate test") } }, ...auth(principalToken) });
    const uploadBody = await uploadResponse.json();
    expect(uploadResponse.status(), JSON.stringify(uploadBody)).toBe(201);
    expect(uploadBody.attachment.storageKey).toBeUndefined();
    const attachmentId = uploadBody.attachment._id;

    const studentList = await studentApi.get("/api/v1/homework?limit=100", auth(studentToken));
    const studentBody = await studentList.json();
    expect(studentList.status(), JSON.stringify(studentBody)).toBe(200);
    const visible = studentBody.data.find((item: any) => item._id === homework._id);
    expect(visible).toBeTruthy();
    expect(visible.attachments[0].storageKey).toBeUndefined();
    expect(visible.attachments[0].name).toBe("worksheet.pdf");

    const signedResponse = await studentApi.get(`/api/v1/homework/${homework._id}/attachments/${attachmentId}/url`, auth(studentToken));
    const signedBody = await signedResponse.json();
    expect(signedResponse.status(), JSON.stringify(signedBody)).toBe(200);
    expect(signedBody.url).toContain("X-Amz-Signature=");
    expect(signedBody.expiresIn).toBe(600);

    const download = await studentApi.get(signedBody.url);
    expect(download.status()).toBe(200);
    expect((await download.body()).subarray(0, 5).toString()).toBe("%PDF-");

    const studentWrite = await studentApi.post(`/api/v1/homework/${homework._id}/attachments`, { multipart: { file: { name: "denied.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7\ndenied") } }, ...auth(studentToken) });
    expect(studentWrite.status()).toBe(403);

    const deleteResponse = await principalApi.delete(`/api/v1/homework/${homework._id}/attachments/${attachmentId}`, auth(principalToken));
    expect(deleteResponse.status()).toBe(200);
    if (target.createdSubjectId) await principalApi.delete(`/api/v1/academics/subjects/${target.createdSubjectId}`, auth(principalToken));
    await principalApi.dispose(); await studentApi.dispose();
  });
});
