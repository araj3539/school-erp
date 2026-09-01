import { test, expect } from "@playwright/test";

const apiUrl = process.env.E2E_API_URL;
const fixturePassword = process.env.E2E_FIXTURE_PASSWORD;
const schoolACode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A";
const schoolAStudent = process.env.E2E_SCHOOL_A_STUDENT_ID;
const emails = {
  principalA: "principal.a@phase1.example.com",
  teacherA: "teacher.a@phase1.example.com",
};

const cachedTokens: Record<string, string | undefined> = {
  principalA: process.env.E2E_PRINCIPAL_A_ACCESS_TOKEN,
  teacherA: process.env.E2E_TEACHER_A_ACCESS_TOKEN,
};

async function login(api: any, role: keyof typeof emails) {
  const cached = cachedTokens[role];
  if (cached) return cached;
  if (!fixturePassword) throw new Error("E2E_FIXTURE_PASSWORD is required");
  const response = await api.post("/api/v1/auth/login", {
    data: { email: emails[role], password: fixturePassword, schoolCode: schoolACode },
  });
  const body = await response.json().catch(() => ({}));
  expect(response.status(), `Login failed: ${JSON.stringify(body)}`).toBe(200);
  const token = body.accessToken ?? body.data?.accessToken;
  expect(token).toBeTruthy();
  return token;
}

function calendarDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return calendarDate(date);
}

async function getFixtureContext(api: any, principalToken: string) {
  if (!schoolAStudent) throw new Error("E2E_SCHOOL_A_STUDENT_ID is required");

  const studentResponse = await api.get(`/api/v1/students/${schoolAStudent}`, {
    headers: { Authorization: `Bearer ${principalToken}` },
  });
  expect(studentResponse.status()).toBe(200);
  const studentBody = await studentResponse.json();
  const student = studentBody.student;
  expect(student?.classId?.toString()).toBeTruthy();
  expect(student?.sectionId?.toString()).toBeTruthy();

  const yearsResponse = await api.get("/api/v1/academic-years", {
    headers: { Authorization: `Bearer ${principalToken}` },
  });
  expect(yearsResponse.status()).toBe(200);
  const yearsBody = await yearsResponse.json();
  const years = yearsBody.data ?? [];
  const current = years.find((year: any) => year.isCurrent);
  expect(current?.startDate).toBeTruthy();
  expect(current?.endDate).toBeTruthy();

  return {
    studentId: schoolAStudent,
    classId: student.classId.toString(),
    sectionId: student.sectionId.toString(),
    academicYear: current,
  };
}

test.describe("Phase 3 attendance acceptance", () => {
  test("teacher cannot correct an existing attendance record", async ({ request }) => {
    const principalToken = await login(request, "principalA");
    const teacherToken = await login(request, "teacherA");
    const context = await getFixtureContext(request, principalToken);
    const date = addDays(calendarDate(context.academicYear.startDate), 1);
    const records = [{ studentId: context.studentId, status: "present" }];

    const create = await request.post("/api/v1/attendance", {
      headers: { Authorization: `Bearer ${principalToken}` },
      data: { date, classId: context.classId, sectionId: context.sectionId, records },
    });
    expect([201, 200]).toContain(create.status());

    const teacherCorrection = await request.post("/api/v1/attendance", {
      headers: { Authorization: `Bearer ${teacherToken}` },
      data: { date, classId: context.classId, sectionId: context.sectionId, records: [{ ...records[0], status: "absent" }] },
    });
    expect(teacherCorrection.status()).toBe(403);
  });

  test("principal can correct an existing attendance record", async ({ request }) => {
    const principalToken = await login(request, "principalA");
    const context = await getFixtureContext(request, principalToken);
    const date = addDays(calendarDate(context.academicYear.startDate), 2);
    const records = [{ studentId: context.studentId, status: "present" }];

    const create = await request.post("/api/v1/attendance", {
      headers: { Authorization: `Bearer ${principalToken}` },
      data: { date, classId: context.classId, sectionId: context.sectionId, records },
    });
    expect([201, 200]).toContain(create.status());

    const correction = await request.post("/api/v1/attendance", {
      headers: { Authorization: `Bearer ${principalToken}` },
      data: { date, classId: context.classId, sectionId: context.sectionId, records: [{ ...records[0], status: "late" }] },
    });
    expect(correction.status()).toBe(200);
    const body = await correction.json();
    expect(body.corrected).toBe(true);
  });

  test("out-of-academic-year attendance is rejected", async ({ request }) => {
    const principalToken = await login(request, "principalA");
    const context = await getFixtureContext(request, principalToken);
    const date = addDays(calendarDate(context.academicYear.startDate), -1);

    const response = await request.post("/api/v1/attendance", {
      headers: { Authorization: `Bearer ${principalToken}` },
      data: {
        date,
        classId: context.classId,
        sectionId: context.sectionId,
        records: [{ studentId: context.studentId, status: "present" }],
      },
    });
    expect(response.status()).toBe(400);
  });

  test("attendance list preserves class, section and date filters", async ({ request }) => {
    const principalToken = await login(request, "principalA");
    const context = await getFixtureContext(request, principalToken);
    const date = addDays(calendarDate(context.academicYear.startDate), 1);

    const response = await request.get("/api/v1/attendance", {
      headers: { Authorization: `Bearer ${principalToken}` },
      params: { classId: context.classId, sectionId: context.sectionId, date },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data).toBeInstanceOf(Array);
    for (const item of body.data) {
      expect(item.classId?.toString()).toBe(context.classId);
      expect(item.sectionId?.toString()).toBe(context.sectionId);
      expect(calendarDate(item.date)).toBe(date);
    }
  });
});
