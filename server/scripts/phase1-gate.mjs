import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(scriptDir, "../.env") });

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

const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["playwright", "test", "e2e/phase1-security.spec.ts"],
  { stdio: "inherit", env: process.env },
);

process.exit(result.status ?? 1);
