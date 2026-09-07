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

async function login(request: any, email: string, schoolCode = "SCH-E2E-A") {
  expect(fixturePassword, "E2E_FIXTURE_PASSWORD is required").toBeTruthy();
  const response = await request.post(apiUrl("/api/v1/auth/login"), {
    data: { email, password: fixturePassword, schoolCode }
  });
  const body = await response.json().catch(() => ({}));
  expect(response.status(), `Login failed: ${JSON.stringify(body)}`).toBe(200);
  return body.accessToken ?? body.data?.accessToken;
}

test("staff lifecycle enforces tenant isolation, RBAC and compensation visibility", async ({ request }) => {
  const principalToken = await login(request, "principal.e2e.a@example.com");
  const principalHeaders = { Authorization: `Bearer ${principalToken}` };
  const employeeId = `ALO31-${Date.now()}`;

  const createResponse = await request.post(apiUrl("/api/v1/staff"), {
    headers: principalHeaders,
    data: {
      employeeId,
      firstName: "Phase10",
      lastName: "Staff",
      email: `${employeeId.toLowerCase()}@example.com`,
      phone: "9000000099",
      department: "Administration",
      designation: "Operations Coordinator",
      employmentType: "full_time",
      joiningDate: "2026-09-07",
      salary: 55000
    }
  });
  const createdBody = await createResponse.json().catch(() => ({}));
  expect(createResponse.status(), `Staff create failed: ${JSON.stringify(createdBody)}`).toBe(201);
  expect(createdBody.staff.employeeId).toBe(employeeId);
  expect(createdBody.staff.salary).toBeUndefined();
  const staffId = createdBody.staff._id;

  const listResponse = await request.get(apiUrl(`/api/v1/staff?search=${employeeId}&page=1&limit=10`), { headers: principalHeaders });
  const listBody = await listResponse.json().catch(() => ({}));
  expect(listResponse.status(), `Staff list failed: ${JSON.stringify(listBody)}`).toBe(200);
  expect(listBody.data).toHaveLength(1);
  expect(listBody.data[0].schoolId).toBeTruthy();
  expect(listBody.data[0].salary).toBeUndefined();

  const updateResponse = await request.put(apiUrl(`/api/v1/staff/${staffId}`), {
    headers: principalHeaders,
    data: { designation: "Senior Operations Coordinator" }
  });
  const updateBody = await updateResponse.json().catch(() => ({}));
  expect(updateResponse.status(), `Staff update failed: ${JSON.stringify(updateBody)}`).toBe(200);
  expect(updateBody.staff.designation).toBe("Senior Operations Coordinator");
  expect(updateBody.staff.salary).toBeUndefined();

  const teacherToken = await login(request, "teacher.e2e.a@example.com");
  const teacherResponse = await request.get(apiUrl(`/api/v1/staff/${staffId}`), {
    headers: { Authorization: `Bearer ${teacherToken}` }
  });
  expect(teacherResponse.status()).toBe(403);

  const principalBToken = await login(request, "principal.e2e.b@example.com", "SCH-E2E-B");
  const crossTenantResponse = await request.get(apiUrl(`/api/v1/staff/${staffId}`), {
    headers: { Authorization: `Bearer ${principalBToken}` }
  });
  expect(crossTenantResponse.status()).toBe(404);

  const deactivateResponse = await request.delete(apiUrl(`/api/v1/staff/${staffId}`), { headers: principalHeaders });
  expect(deactivateResponse.status()).toBe(200);

  const detailResponse = await request.get(apiUrl(`/api/v1/staff/${staffId}`), { headers: principalHeaders });
  const detailBody = await detailResponse.json().catch(() => ({}));
  expect(detailResponse.status()).toBe(200);
  expect(detailBody.staff.status).toBe("inactive");
  expect(detailBody.staff.salary).toBeUndefined();
});
