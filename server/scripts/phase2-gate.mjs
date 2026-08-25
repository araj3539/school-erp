import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import { readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

const serverRoot = process.cwd();
config({ path: resolve(serverRoot, ".env") });

const required = ["E2E_API_URL", "E2E_FIXTURE_PASSWORD"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Phase 2 gate missing variables: ${missing.join(", ")}`);
  process.exit(2);
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const bootstrap = spawnSync(process.execPath, [resolve(serverRoot, "scripts/phase2-token-bootstrap.mjs")], {
  cwd: serverRoot,
  encoding: "utf8",
  env: process.env,
});

if (bootstrap.status !== 0 || !bootstrap.stdout.trim()) {
  console.error(bootstrap.stderr?.trim() || "Phase 2 token bootstrap failed");
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
  E2E_STUDENT_A_ACCESS_TOKEN: tokens.studentA.accessToken,
  E2E_PARENT_A_ACCESS_TOKEN: tokens.parentA.accessToken,
  E2E_STUDENT_A_REFRESH_TOKEN: tokens.studentA.refreshToken || "",
};

const gates = [
  ["phase1", "test:e2e:phase1"],
  ["documents", "test:e2e:phase2:documents"],
  ["payments", "test:e2e:phase2:payments"],
  ["audit", "test:e2e:phase2:audit"],
  ["roles", "test:e2e:phase2:roles"],
];

const results = [];
for (const [name, script] of gates) {
  console.log(`\n=== ${name} ===`);
  const result = spawnSync(npmCommand, ["run", script], {
    stdio: "inherit",
    shell: process.platform === "win32",
    cwd: serverRoot,
    env,
  });
  const code = result.status ?? 1;
  const state = code === 0 ? "PASS" : code === 2 ? "BLOCKED" : "FAIL";
  results.push({ name, code, state });
}

console.log("\n=== Phase 2 gate summary ===");
for (const result of results) console.log(`${result.state.padEnd(8)} ${result.name} (exit ${result.code})`);

process.exit(results.some(({ state }) => state === "FAIL") ? 1 : 0);
