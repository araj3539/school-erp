import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const serverDir = resolve(scriptDir, "..");
const workspaceRoot = resolve(serverDir, "..");
config({ path: resolve(serverDir, ".env") });

const required = ["E2E_API_URL", "E2E_FIXTURE_PASSWORD"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error("Phase 2 audit verification cannot run. Missing required environment variables:");
  missing.forEach((name) => console.error(`- ${name}`));
  process.exit(2);
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(
  npmCommand,
  ["exec", "--workspace", "server", "playwright", "--", "test", "e2e/phase2-audit.spec.ts", "--workers=1"],
  { cwd: workspaceRoot, stdio: "inherit", env: process.env, shell: process.platform === "win32" },
);

if (result.error) {
  console.error(`Failed to start Playwright: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
