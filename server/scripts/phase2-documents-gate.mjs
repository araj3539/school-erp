import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const serverDir = path.resolve(import.meta.dirname, "..");
const envPath = path.join(serverDir, ".env");

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv(envPath);

const required = [
  "E2E_API_URL",
  "E2E_FIXTURE_PASSWORD",
  "E2E_SCHOOL_A_STUDENT_ID",
  "E2E_SCHOOL_B_STUDENT_ID",
];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Phase 2 document gate requires: ${missing.join(", ")}`);
  process.exit(2);
}

console.log(`Phase 2 document verification target: ${process.env.E2E_API_URL}`);
console.log(`Phase 2 environment: ${required.length} required variables loaded from server/.env`);
console.log("Starting Playwright Phase 2 document/recovery security suite with 1 worker...\n");

const result = spawnSync(
  process.platform === "win32" ? process.env.ComSpec : "npm",
  process.platform === "win32"
    ? ["/d", "/c", "npx playwright test e2e/phase2-documents.spec.ts --workers=1"]
    : ["playwright", "test", "e2e/phase2-documents.spec.ts", "--workers=1"],
  {
    cwd: serverDir,
    env: process.env,
    stdio: "inherit",
  }
);

if (result.error) {
  console.error(`Failed to start Playwright: ${result.error.message}`);
  process.exit(1);
}

const code = result.status ?? 1;
console.log(`Phase 2 document Playwright exit code: ${code}`);
process.exit(code);
