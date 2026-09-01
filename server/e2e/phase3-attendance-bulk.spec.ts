import { test, expect } from "@playwright/test";

const baseUrl = process.env.E2E_API_URL;
const principalToken = process.env.E2E_PRINCIPAL_A_ACCESS_TOKEN;
const studentId = process.env.E2E_SCHOOL_A_STUDENT_ID;

test("principal can submit two attendance days atomically", async ({ request }) => {
  expect(baseUrl).toBeTruthy();
  expect(principalToken).toBeTruthy();
  expect(studentId).toBeTruthy();

  const studentResponse = await request.get(`/api/v1/students/${studentId}`, {
    headers: { Authorization: `Bearer ${principalToken}` },
  });
  expect(studentResponse.status()).toBe(200);
  const { student } = await studentResponse.json();
  expect(student?.classId?.toString()).toBeTruthy();
  expect(student?.sectionId?.toString()).toBeTruthy();

  const yearsResponse = await request.get("/api/v1/academic-years", {
    headers: { Authorization: `Bearer ${principalToken}` },
  });
  expect(yearsResponse.status()).toBe(200);
  const { data: years = [] } = await yearsResponse.json();
  const current = years.find((year: any) => year.isCurrent);
  expect(current?.startDate).toBeTruthy();

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
          classId: student.classId.toString(),
          sectionId: student.sectionId.toString(),
          records: [{ studentId, status: "present" }],
        },
        {
          date: toDate(second),
          classId: student.classId.toString(),
          sectionId: student.sectionId.toString(),
          records: [{ studentId, status: "present" }],
        },
      ],
    },
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.count).toBe(2);
  expect(body.results).toHaveLength(2);
  expect(body.results.map((result: any) => result.date)).toEqual([toDate(first), toDate(second)]);
});
