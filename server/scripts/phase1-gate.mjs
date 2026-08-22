import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const serverDir = resolve(scriptDir, "..");
config({ path: resolve(serverDir, ".env") });

const required = [
  "E2E_API_URL",
  "E2E_SCHOOL_A_STUDENT_ID",
  "E2E_SCHOOL_B_STUDENT_ID",
  "E2E_PRINCIPAL_A_TOKEN",
  "E2E_TEACHER_A_TOKEN",
  "E2E_STUDENT_A_TOKEN",
  "E2E_PARENT_A_TOKEN",
  "E2E_REFRESH_TOKEN",
];

const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error("Phase 1 live verification cannot run. Missing required environment variables:");
  for (const name of missing) console.error(`- ${name}`);
  process.exit(2);
}

console.log(`Phase 1 live verification target: ${process.env.E2E_API_URL}`);
console.log(`Phase 1 environment: all ${required.length} required variables loaded from server/.env`);
console.log("Starting Playwright Phase 1 security suite...\n");

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(
  command,
  ["playwright", "test", "e2e/phase1-security.spec.ts"],
  { stdio: "inherit", env: process.env, cwd: serverDir },
);

if (result.error) {
  console.error(`\nFailed to start Playwright: ${result.error.message}`);
  process.exit(1);
}

const exitCode = result.status ?? (result.signal ? 1 : 0);
console.log(`\nPhase 1 Playwright exit code: ${exitCode}`);
process.exit(exitCode);
