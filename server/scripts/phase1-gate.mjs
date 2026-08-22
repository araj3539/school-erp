import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const serverDir = resolve(scriptDir, "..");
const workspaceRoot = resolve(serverDir, "..");
config({ path: resolve(serverDir, ".env") });

const required = [
  "E2E_API_URL",
  "E2E_SCHOOL_A_STUDENT_ID",
  "E2E_SCHOOL_B_STUDENT_ID",
  "E2E_FIXTURE_PASSWORD",
];

const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error("Phase 1 live verification cannot run. Missing required environment variables:");
  for (const name of missing) console.error(`- ${name}`);
  process.exit(2);
}

console.log(`Phase 1 live verification target: ${process.env.E2E_API_URL}`);
console.log(`Phase 1 environment: all ${required.length} required variables loaded from server/.env`);
console.log("Starting Playwright Phase 1 security suite with 1 worker...\n");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(
  npmCommand,
  ["exec", "--workspace", "server", "playwright", "--", "test", "e2e/phase1-security.spec.ts", "--workers=1"],
  {
    cwd: workspaceRoot,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  },
);

if (result.error) {
  console.error(`\nFailed to start Playwright: ${result.error.message}`);
  process.exit(1);
}

console.log(`\nPhase 1 Playwright exit code: ${result.status ?? 1}`);
process.exit(result.status ?? 1);
