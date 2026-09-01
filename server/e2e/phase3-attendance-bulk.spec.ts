import { config } from "dotenv";
import { resolve } from "node:path";
import { test, expect } from "@playwright/test";

// Support both direct execution from the repository root and execution with
// the server package as the working directory.
config({ path: resolve(process.cwd(), "server", ".env") });
config({ path: resolve(process.cwd(), ".env") });

const baseUrl = process.env.E2E_API_URL;
const principalToken = process.env.E2E_PRINCIPAL_A_ACCESS_TOKEN;
const studentId = process.env.E2E_SCHOOL_A_STUDENT_ID;

function normalizeObjectId(value: unknown): string | undefined {
  if (typeof value === "string" && /^[a-f\d]{24}$/i.test(value)) return value;
  if (value && typeof value === "object" && "$oid" in value) {
    const oid = (value as { $oid?: unknown }).$oid;
    if (typeof oid === "string" && /^[a-f\d]{24}$/i.test(oid)) return oid;
  }
  return undefined;
}

test("principal can submit two attendance days atomically", async ({ request }) => {
  expect(baseUrl).toBeTruthy();
  expect(principalToken).toBeTruthy();
  expect(studentId).toBeTruthy();

  const studentResponse = await request.get(`/api/v1/students/${studentId}`, {
    headers: { Authorization: `Bearer ${principalToken}` },
  });
  const studentBody = await studentResponse.json().catch(() => ({}));
  expect(studentResponse.status(), `Student lookup failed: ${JSON.stringify(studentBody)}`).toBe(200);
  const student = studentBody.student ?? studentBody.data?.student ?? studentBody.data ?? studentBody;
  const classId = normalizeObjectId(student?.classId);
  const sectionId = normalizeObjectId(student?.sectionId);
  expect(classId, `Fixture student has invalid classId: ${JSON.stringify(student?.classId)}`).toBeTruthy();
  expect(sectionId, `Fixture student has invalid sectionId: ${JSON.stringify(student?.sectionId)}`).toBeTruthy();

  const yearsResponse = await request.get("/api/v1/academic-years", {
    headers: { Authorization: `Bearer ${principalToken}` },
  });
  const yearsBody = await yearsResponse.json().catch(() => ({}));
  expect(yearsResponse.status(), `Academic year lookup failed: ${JSON.stringify(yearsBody)}`).toBe(200);
  const years = yearsBody.data ?? yearsBody.academicYears ?? [];
  const current = years.find((year: any) => year.isCurrent);
  expect(current?.startDate, `No current academic year: ${JSON.stringify(years)}`).toBeTruthy();

  const first = new Date(current.startDate);
  first.setUTCDate(first.getUTCDate() + 3);
  const second = new Date(first);
  second.setUTCDate(second.getUTCDate() + 1);
  const toDate = (date: Date) => date.toISOString().slice(0, 10);

  const response = await request.post("/api/v1/attendance/bulk", {
    headers: { Authorization: `Bearer ${principalToken}` },
    data: {
      entries: [
        {
          date: toDate(first),
          classId,
          sectionId,
          records: [{ studentId, status: "present" }],
        },
        {
          date: toDate(second),
          classId,
          sectionId,
          records: [{ studentId, status: "present" }],
        },
      ],
    },
  });

  const body = await response.json().catch(() => ({}));
  expect(response.status(), `Bulk attendance response: ${JSON.stringify(body)}`).toBe(200);
  expect(body.count).toBe(2);
  expect(body.results).toHaveLength(2);
  expect(body.results.map((result: any) => result.date)).toEqual([toDate(first), toDate(second)]);
});
