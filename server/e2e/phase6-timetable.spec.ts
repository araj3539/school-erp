import { config } from "dotenv";
import { resolve } from "node:path";
import { test, expect, request as playwrightRequest } from "@playwright/test";
config({ path: resolve(process.cwd(), ".env") });
const apiUrl = process.env.E2E_API_URL; const fixturePassword = process.env.E2E_FIXTURE_PASSWORD; const schoolCode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A"; const studentId = process.env.E2E_SCHOOL_A_STUDENT_ID;
const principalEmail = "principal.a@phase1.example.com"; const studentEmail = "student.a@phase1.example.com";
async function login(api: any, email: string) { const response = await api.post("/api/v1/auth/login", { data: { email, password: fixturePassword, schoolCode } }); const body = await response.json(); expect(response.status(), JSON.stringify(body)).toBe(200); return body.accessToken ?? body.data?.accessToken; }
function auth(token: string) { return { headers: { Authorization: `Bearer ${token}` } }; }
async function create(api: any, token: string, data: any) { const response = await api.post("/api/v1/timetable", { data, ...auth(token) }); const body = await response.json().catch(() => ({})); return { response, body }; }
function title(prefix: string) { return `Phase 6 timetable ${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

test.beforeAll(() => { expect(apiUrl).toBeTruthy(); expect(fixturePassword).toBeTruthy(); expect(studentId).toBeTruthy(); });

test.describe("Phase 6 Timetable API", () => {
  test("rejects class, teacher and room conflicts", async () => {
    const api = await playwrightRequest.newContext({ baseURL: apiUrl }); const token = await login(api, principalEmail);
    const studentResponse = await api.get(`/api/v1/students/${studentId}`, auth(token)); const studentBody = await studentResponse.json(); const student = studentBody.student ?? studentBody.data?.student ?? studentBody.data ?? studentBody;
    const classId = typeof student.classId === "object" ? student.classId?._id : student.classId; const sectionId = typeof student.sectionId === "object" ? student.sectionId?._id : student.sectionId; expect(classId).toMatch(/^[a-f\d]{24}$/i);
    const yearsResponse = await api.get("/api/v1/academic-years", auth(token)); const years = (await yearsResponse.json()).data || []; const academicYearId = years.find((year: any) => year.isCurrent)?._id || years[0]?._id;
    const subjectsResponse = await api.get(`/api/v1/academics/subjects?classId=${classId}`, auth(token)); const subjects = (await subjectsResponse.json()).data || [];
    const teachersResponse = await api.get("/api/v1/teachers?limit=100&status=active", auth(token)); const teachers = (await teachersResponse.json()).data || [];
    const classesResponse = await api.get("/api/v1/academics/classes?limit=100", auth(token)); const classes = (await classesResponse.json()).data || [];
    expect(academicYearId).toMatch(/^[a-f\d]{24}$/i); expect(subjects.length).toBeGreaterThan(0); expect(teachers.length).toBeGreaterThan(0);
    const base = { academicYearId, classId, sectionId: sectionId || undefined, subjectId: subjects[0]._id, teacherId: teachers[0]._id, dayOfWeek: 1, startTime: "10:00", endTime: "10:45", roomNumber: "QA-101", periodLabel: "P1" };
    const created = await create(api, token, base); expect(created.response.status(), JSON.stringify(created.body)).toBe(201);
    const classConflict = await create(api, token, { ...base, teacherId: teachers[Math.min(1, teachers.length - 1)]._id, startTime: "10:15", endTime: "11:00" }); expect(classConflict.response.status(), JSON.stringify(classConflict.body)).toBe(409); expect(classConflict.body.code).toBe("TIMETABLE_CLASS_CONFLICT");
    const otherClass = classes.find((item: any) => item._id !== classId);
    if (otherClass) { const otherSubjectsResponse = await api.get(`/api/v1/academics/subjects?classId=${otherClass._id}`, auth(token)); const otherSubjects = (await otherSubjectsResponse.json()).data || []; if (otherSubjects.length) {
      const teacherConflict = await create(api, token, { ...base, classId: otherClass._id, sectionId: undefined, subjectId: otherSubjects[0]._id, startTime: "10:15", endTime: "11:00" }); expect(teacherConflict.response.status(), JSON.stringify(teacherConflict.body)).toBe(409); expect(teacherConflict.body.code).toBe("TIMETABLE_TEACHER_CONFLICT");
      const otherTeacher = teachers.find((item: any) => item._id !== teachers[0]._id); if (otherTeacher) { const roomConflict = await create(api, token, { ...base, classId: otherClass._id, sectionId: undefined, subjectId: otherSubjects[0]._id, teacherId: otherTeacher._id, startTime: "10:15", endTime: "11:00" }); expect(roomConflict.response.status(), JSON.stringify(roomConflict.body)).toBe(409); expect(roomConflict.body.code).toBe("TIMETABLE_ROOM_CONFLICT"); }
    }}
    await api.dispose();
  });

  test("student sees only their class timetable and cannot write", async () => {
    const principalApi = await playwrightRequest.newContext({ baseURL: apiUrl }); const studentApi = await playwrightRequest.newContext({ baseURL: apiUrl }); const principalToken = await login(principalApi, principalEmail); const studentToken = await login(studentApi, studentEmail);
    const studentResponse = await principalApi.get(`/api/v1/students/${studentId}`, auth(principalToken)); const studentBody = await studentResponse.json(); const student = studentBody.student ?? studentBody.data?.student ?? studentBody.data ?? studentBody; const classId = typeof student.classId === "object" ? student.classId?._id : student.classId;
    const response = await studentApi.get("/api/v1/timetable?limit=100", auth(studentToken)); expect(response.status()).toBe(200); const entries = (await response.json()).data || []; expect(entries.every((entry: any) => (entry.classId?._id || entry.classId) === classId)).toBe(true);
    const denied = await studentApi.post("/api/v1/timetable", { data: { classId, academicYearId: classId, subjectId: classId, teacherId: classId, dayOfWeek: 1, startTime: "12:00", endTime: "12:45" }, ...auth(studentToken) }); expect(denied.status()).toBe(403);
    await principalApi.dispose(); await studentApi.dispose();
  });
});
