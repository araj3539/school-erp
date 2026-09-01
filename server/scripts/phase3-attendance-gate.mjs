import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import { readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

const serverRoot = process.cwd();
config({ path: resolve(serverRoot, ".env") });

const required = ["E2E_API_URL", "E2E_SCHOOL_A_STUDENT_ID", "E2E_FIXTURE_PASSWORD"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Phase 3 attendance gate missing variables: ${missing.join(", ")}`);
  process.exit(2);
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const bootstrap = spawnSync(process.execPath, [resolve(serverRoot, "scripts/phase2-token-bootstrap.mjs")], {
  cwd: serverRoot,
  encoding: "utf8",
  env: process.env,
});

if (bootstrap.status !== 0 || !bootstrap.stdout.trim()) {
  console.error(bootstrap.stderr?.trim() || "Phase 3 token bootstrap failed");
  process.exit(1);
}

const tokenFile = bootstrap.stdout.trim().split(/\r?\n/).at(-1);
let tokens;
try {
  tokens = JSON.parse(readFileSync(tokenFile, "utf8"));
} finally {
  try { unlinkSync(tokenFile); } catch {}
}

const env = {
  ...process.env,
  E2E_PRINCIPAL_A_ACCESS_TOKEN: tokens.principalA.accessToken,
  E2E_TEACHER_A_ACCESS_TOKEN: tokens.teacherA.accessToken,
};

const result = spawnSync(npmCommand, ["run", "test:e2e:phase3:attendance"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  cwd: serverRoot,
  env,
});

process.exit(result.status ?? 1);
