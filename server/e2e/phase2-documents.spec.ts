import { test, expect } from "@playwright/test";

const apiUrl = process.env.E2E_API_URL;
const fixturePassword = process.env.E2E_FIXTURE_PASSWORD;
const schoolAStudent = process.env.E2E_SCHOOL_A_STUDENT_ID;
const schoolBStudent = process.env.E2E_SCHOOL_B_STUDENT_ID;
const schoolADocument = process.env.E2E_SCHOOL_A_DOCUMENT_ID;
const schoolACode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A";
const cachedTokens: Record<string, string | undefined> = {
  "principal.a@phase1.example.com": process.env.E2E_PRINCIPAL_A_ACCESS_TOKEN,
  "teacher.a@phase1.example.com": process.env.E2E_TEACHER_A_ACCESS_TOKEN,
  "student.a@phase1.example.com": process.env.E2E_STUDENT_A_ACCESS_TOKEN,
  "parent.a@phase1.example.com": process.env.E2E_PARENT_A_ACCESS_TOKEN,
};

const emails = {
  principalA: "principal.a@phase1.example.com",
  teacherA: "teacher.a@phase1.example.com",
  studentA: "student.a@phase1.example.com",
  parentA: "parent.a@phase1.example.com",
};

async function login(request: any, email: string) {
  const cached = cachedTokens[email];
  if (cached) return cached;
  if (!apiUrl || !fixturePassword) throw new Error("E2E_API_URL and E2E_FIXTURE_PASSWORD are required");
  const response = await request.post("/api/v1/auth/login", {
    data: { email, password: fixturePassword, schoolCode: schoolACode },
  });
  const body = await response.json().catch(() => ({}));
  expect(response.status(), `Login failed for ${email}: ${JSON.stringify(body)}`).toBe(200);
  const accessToken = body.accessToken ?? body.data?.accessToken;
  expect(accessToken).toBeTruthy();
  return accessToken;
}

function auth(accessToken: string) {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}

test.describe("Phase 2 document and recovery authorization", () => {
  test.skip(!apiUrl || !fixturePassword || !schoolAStudent || !schoolBStudent, "Phase 2 E2E fixture variables are not configured");

  test("student cannot list recovery history for another tenant", async ({ request }) => {
    const token = await login(request, emails.studentA);
    const response = await request.get(`/api/v1/students/${schoolBStudent}/document-recoveries`, auth(token));
    expect([403, 404]).toContain(response.status());
  });

  test("parent cannot list recovery history for an unlinked student", async ({ request }) => {
    const token = await login(request, emails.parentA);
    const response = await request.get(`/api/v1/students/${schoolBStudent}/document-recoveries`, auth(token));
    expect([403, 404]).toContain(response.status());
  });

  test("teacher cannot preview recovery for a student outside the tenant or assigned class", async ({ request }) => {
    const token = await login(request, emails.teacherA);
    const response = await request.get(`/api/v1/students/${schoolBStudent}/document-recoveries/000000000000000000000000/preview`, auth(token));
    expect([403, 404]).toContain(response.status());
  });

  test("student cannot restore a document even with a valid recovery id", async ({ request }) => {
    const token = await login(request, emails.studentA);
    const response = await request.post(`/api/v1/students/${schoolAStudent}/document-recoveries/000000000000000000000000/restore`, auth(token));
    expect(response.status()).toBe(403);
  });

  test("parent cannot restore a linked child's document", async ({ request }) => {
    const token = await login(request, emails.parentA);
    const response = await request.post(`/api/v1/students/${schoolAStudent}/document-recoveries/000000000000000000000000/restore`, auth(token));
    expect(response.status()).toBe(403);
  });

  test("teacher cannot restore a document", async ({ request }) => {
    const token = await login(request, emails.teacherA);
    const response = await request.post(`/api/v1/students/${schoolAStudent}/document-recoveries/000000000000000000000000/restore`, auth(token));
    expect(response.status()).toBe(403);
  });

  test("principal cannot read recovery history across tenants", async ({ request }) => {
    const token = await login(request, emails.principalA);
    const response = await request.get(`/api/v1/students/${schoolBStudent}/document-recoveries`, auth(token));
    expect([403, 404]).toContain(response.status());
  });

  test("authorized student receives only a short-lived signed document URL", async ({ request }) => {
    test.skip(!schoolADocument, "E2E_SCHOOL_A_DOCUMENT_ID is not configured with a populated document fixture");

    const token = await login(request, emails.studentA);
    const detail = await request.get(`/api/v1/students/${schoolAStudent}`, auth(token));
    expect(detail.status()).toBe(200);
    const detailBody = await detail.json();
    const documents = detailBody.student?.documents ?? [];
    expect(documents.length).toBeGreaterThan(0);
    expect(documents).not.toContainEqual(expect.objectContaining({ url: expect.anything() }));
    expect(documents).not.toContainEqual(expect.objectContaining({ publicId: expect.anything() }));

    const response = await request.get(`/api/v1/students/${schoolAStudent}/documents/${schoolADocument}/url`, auth(token));
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.expiresIn).toBe(600);
    expect(typeof body.url).toBe("string");
    expect(body.url.length).toBeGreaterThan(0);
    expect(body).not.toHaveProperty("key");
    expect(body).not.toHaveProperty("publicId");
    expect(body).not.toHaveProperty("storageKey");
    expect(body).not.toHaveProperty("recoveryKey");
  });

  test("linked parent receives the same bounded signed-delivery contract", async ({ request }) => {
    test.skip(!schoolADocument, "E2E_SCHOOL_A_DOCUMENT_ID is not configured with a populated document fixture");

    const token = await login(request, emails.parentA);
    const response = await request.get(`/api/v1/students/${schoolAStudent}/documents/${schoolADocument}/url`, auth(token));
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.expiresIn).toBe(600);
    expect(typeof body.url).toBe("string");
    expect(body.url.length).toBeGreaterThan(0);
    expect(body).not.toHaveProperty("key");
    expect(body).not.toHaveProperty("publicId");
    expect(body).not.toHaveProperty("storageKey");
    expect(body).not.toHaveProperty("recoveryKey");
  });
});
