import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });

const apiUrl = process.env.E2E_API_URL;
const password = process.env.E2E_FIXTURE_PASSWORD;
const schoolCode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A";

const fixtures = {
  principalA: "principal.a@phase1.example.com",
  teacherA: "teacher.a@phase1.example.com",
  studentA: "student.a@phase1.example.com",
  parentA: "parent.a@phase1.example.com",
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
  for (const [role, email] of Object.entries(fixtures)) {
    const token = await login(email);
    process.env[`E2E_${role.toUpperCase()}_ACCESS_TOKEN`] = token.accessToken;
    if (role === "studentA" && token.refreshToken) {
      process.env.E2E_STUDENT_A_REFRESH_TOKEN = token.refreshToken;
    }
  }

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("E2E_") && value) console.log(`${key}=${value}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
