import { config } from "dotenv";
import { resolve } from "node:path";
import { test, expect } from "@playwright/test";

config({ path: resolve(process.cwd(), ".env") });
const baseUrl = process.env.E2E_API_URL;
const fixturePassword = process.env.E2E_FIXTURE_PASSWORD;

function apiUrl(path: string): string {
  expect(baseUrl, "E2E_API_URL is required").toBeTruthy();
  return new URL(path, baseUrl).toString();
}

async function login(playwright: any, email: string, schoolCode = "SCH-E2E-A") {
  expect(fixturePassword, "E2E_FIXTURE_PASSWORD is required").toBeTruthy();
  const authRequest = await playwright.request.newContext();
  try {
    const response = await authRequest.post(apiUrl("/api/v1/auth/login"), { data: { email, password: fixturePassword, schoolCode } });
    const body = await response.json().catch(() => ({}));
    expect(response.status(), `Login failed: ${JSON.stringify(body)}`).toBe(200);
    return body.accessToken ?? body.data?.accessToken;
  } finally {
    await authRequest.dispose();
  }
}

async function jsonBody(response: any) {
  return response.json().catch(() => ({}));
}

test("library catalog and circulation enforce lifecycle, tenant isolation and concurrency", async ({ request, playwright }) => {
  const principalToken = await login(playwright, "principal.e2e.a@example.com");
  const principalHeaders = { Authorization: `Bearer ${principalToken}` };
  const suffix = `ALO32-${Date.now()}`;

  const studentList = await request.get(apiUrl("/api/v1/students?status=active&page=1&limit=1"), { headers: principalHeaders });
  const studentBody = await jsonBody(studentList);
  expect(studentList.status(), JSON.stringify(studentBody)).toBe(200);
  expect(studentBody.data?.[0]?._id).toBeTruthy();
  const studentId = studentBody.data[0]._id;

  const staffResponse = await request.post(apiUrl("/api/v1/staff"), {
    headers: principalHeaders,
    data: {
      employeeId: suffix,
      firstName: "Library",
      lastName: "Staff",
      email: `${suffix.toLowerCase()}@example.com`,
      phone: "9000000088",
      department: "Library",
      designation: "Librarian",
      employmentType: "full_time",
      joiningDate: "2026-09-07"
    }
  });
  const staffBody = await jsonBody(staffResponse);
  expect(staffResponse.status(), JSON.stringify(staffBody)).toBe(201);
  const staffId = staffBody.staff._id;

  const bookResponse = await request.post(apiUrl("/api/v1/library/books"), {
    headers: principalHeaders,
    data: { title: `Phase 10 Library ${suffix}`, author: "Test Author", isbn: `978-${suffix.replace(/\D/g, "").slice(-10)}`, category: "Engineering", publicationYear: 2026 }
  });
  const bookBody = await jsonBody(bookResponse);
  expect(bookResponse.status(), JSON.stringify(bookBody)).toBe(201);
  const bookId = bookBody.book._id;

  const createCopy = async (accessionNo: string) => {
    const response = await request.post(apiUrl(`/api/v1/library/books/${bookId}/copies`), { headers: principalHeaders, data: { accessionNo } });
    const body = await jsonBody(response);
    expect(response.status(), JSON.stringify(body)).toBe(201);
    return body.copy._id;
  };
  const studentCopyId = await createCopy(`${suffix}-S`);
  const staffCopyId = await createCopy(`${suffix}-F`);
  const raceCopyId = await createCopy(`${suffix}-R`);

  const accountantToken = await login(playwright, "accountant.e2e.a@example.com");
  const accountantHeaders = { Authorization: `Bearer ${accountantToken}` };
  const accountantRead = await request.get(apiUrl(`/api/v1/library/books/${bookId}`), { headers: accountantHeaders });
  expect(accountantRead.status()).toBe(200);
  const accountantWrite = await request.post(apiUrl("/api/v1/library/books"), { headers: accountantHeaders, data: { title: "No Write", author: "Denied" } });
  expect(accountantWrite.status()).toBe(403);

  const teacherToken = await login(playwright, "teacher.e2e.a@example.com");
  const teacherRead = await request.get(apiUrl("/api/v1/library/books"), { headers: { Authorization: `Bearer ${teacherToken}` } });
  expect(teacherRead.status()).toBe(403);

  const principalBToken = await login(playwright, "principal.e2e.b@example.com", "SCH-E2E-B");
  const crossTenant = await request.get(apiUrl(`/api/v1/library/books/${bookId}`), { headers: { Authorization: `Bearer ${principalBToken}` } });
  expect(crossTenant.status()).toBe(404);

  const dueSoon = new Date(Date.now() + 3000).toISOString();
  const studentLoanResponse = await request.post(apiUrl("/api/v1/library/loans"), { headers: principalHeaders, data: { copyId: studentCopyId, borrowerType: "student", borrowerId: studentId, dueAt: dueSoon, dailyFineRate: 25 } });
  const studentLoanBody = await jsonBody(studentLoanResponse);
  expect(studentLoanResponse.status(), JSON.stringify(studentLoanBody)).toBe(201);
  const studentLoanId = studentLoanBody.loan._id;

  const staffLoanResponse = await request.post(apiUrl("/api/v1/library/loans"), { headers: principalHeaders, data: { copyId: staffCopyId, borrowerType: "staff", borrowerId: staffId, dueAt: new Date(Date.now() + 3000).toISOString(), dailyFineRate: 25 } });
  const staffLoanBody = await jsonBody(staffLoanResponse);
  expect(staffLoanResponse.status(), JSON.stringify(staffLoanBody)).toBe(201);
  const staffLoanId = staffLoanBody.loan._id;

  const [raceOne, raceTwo] = await Promise.all([
    request.post(apiUrl("/api/v1/library/loans"), { headers: principalHeaders, data: { copyId: raceCopyId, borrowerType: "student", borrowerId: studentId, dueAt: new Date(Date.now() + 86400000).toISOString() } }),
    request.post(apiUrl("/api/v1/library/loans"), { headers: principalHeaders, data: { copyId: raceCopyId, borrowerType: "staff", borrowerId: staffId, dueAt: new Date(Date.now() + 86400000).toISOString() } })
  ]);
  const raceStatuses = [raceOne.status(), raceTwo.status()].sort((a, b) => a - b);
  expect(raceStatuses).toEqual([201, 409]);
  const winningRaceBody = raceOne.status() === 201 ? await jsonBody(raceOne) : await jsonBody(raceTwo);

  await new Promise((resolveWait) => setTimeout(resolveWait, 3500));
  const overdueList = await request.get(apiUrl("/api/v1/library/loans?status=overdue&page=1&limit=20"), { headers: principalHeaders });
  const overdueBody = await jsonBody(overdueList);
  expect(overdueList.status(), JSON.stringify(overdueBody)).toBe(200);
  expect(overdueBody.data.some((loan: any) => loan._id === studentLoanId || loan._id === staffLoanId)).toBe(true);

  const studentReturn = await request.post(apiUrl(`/api/v1/library/loans/${studentLoanId}/return`), { headers: principalHeaders, data: {} });
  const studentReturnBody = await jsonBody(studentReturn);
  expect(studentReturn.status(), JSON.stringify(studentReturnBody)).toBe(200);
  expect(studentReturnBody.loan.status).toBe("returned");
  expect(studentReturnBody.fineAmount).toBeGreaterThan(0);

  const staffReturn = await request.post(apiUrl(`/api/v1/library/loans/${staffLoanId}/return`), { headers: principalHeaders, data: {} });
  expect(staffReturn.status()).toBe(200);

  const raceReturn = await request.post(apiUrl(`/api/v1/library/loans/${winningRaceBody.loan._id}/return`), { headers: principalHeaders, data: {} });
  expect(raceReturn.status()).toBe(200);

  const returnedCopy = await request.get(apiUrl(`/api/v1/library/copies?search=${suffix}-S&page=1&limit=10`), { headers: principalHeaders });
  const returnedCopyBody = await jsonBody(returnedCopy);
  expect(returnedCopy.status()).toBe(200);
  expect(returnedCopyBody.data[0].status).toBe("available");
});
