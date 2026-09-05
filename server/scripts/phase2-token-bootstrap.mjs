import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { writeFileSync } from "node:fs";

config({ path: resolve(process.cwd(), ".env") });

const apiUrl = process.env.E2E_API_URL;
const password = process.env.E2E_FIXTURE_PASSWORD;
const schoolCode = process.env.E2E_SCHOOL_A_CODE || "SCH-E2E-A";

const fixtures = {
  principalA: "principal.e2e.a@example.com",
  teacherA: "teacher.e2e.a@example.com",
  studentA: "student.e2e.a1@example.com",
  parentA: "parent.e2e.a@example.com",
};

if (!apiUrl || !password) {
  console.error("Phase 2 token bootstrap requires E2E_API_URL and E2E_FIXTURE_PASSWORD");
  process.exit(2);
}

function setCookieValue(setCookie, name) {
  const match = setCookie?.match(new RegExp(`${name}=([^;]+)`));
  return match?.[1];
}

async function login(email) {
  const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ email, password, schoolCode }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Login failed for ${email}: ${response.status} ${JSON.stringify(body)}`);
  }

  const accessToken = body.accessToken ?? body.data?.accessToken;
  if (!accessToken) throw new Error(`No access token returned for ${email}`);

  return {
    accessToken,
    refreshToken: setCookieValue(response.headers.get("set-cookie"), "refresh_token"),
  };
}

try {
  const requestedRoles = process.env.E2E_BOOTSTRAP_ROLES
    ? process.env.E2E_BOOTSTRAP_ROLES.split(",").map((role) => role.trim()).filter(Boolean)
    : Object.keys(fixtures);

  for (const role of requestedRoles) {
    if (!(role in fixtures)) throw new Error(`Unknown E2E bootstrap role: ${role}`);
  }

  const tokens = {};
  for (const role of requestedRoles) {
    tokens[role] = await login(fixtures[role]);
  }

  const outputPath = resolve(tmpdir(), `school-erp-phase2-${randomUUID()}.json`);
  writeFileSync(outputPath, JSON.stringify(tokens), { encoding: "utf8" });
  console.log(outputPath);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
