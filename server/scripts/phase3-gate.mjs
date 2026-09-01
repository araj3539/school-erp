import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import { readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

const serverRoot = process.cwd();
config({ path: resolve(serverRoot, ".env") });

const required = ["E2E_API_URL", "E2E_SCHOOL_A_STUDENT_ID", "E2E_FIXTURE_PASSWORD"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Phase 3 gate missing variables: ${missing.join(", ")}`);
  process.exit(2);
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const bootstrapEnv = { ...process.env, E2E_BOOTSTRAP_ROLES: "principalA,teacherA" };
const bootstrap = spawnSync(process.execPath, [resolve(serverRoot, "scripts/phase2-token-bootstrap.mjs")], {
  cwd: serverRoot,
  encoding: "utf8",
  env: bootstrapEnv,
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

const suites = [
  ["attendance", ["run", "test:e2e:phase3:attendance"]],
  ["bulk", ["run", "test:e2e:phase3:bulk"]],
  ["students", ["run", "test:e2e:phase3:students"]],
];

let failed = false;
for (const [name, args] of suites) {
  console.log(`\n=== ${name} ===\n`);
  const result = spawnSync(npmCommand, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    cwd: serverRoot,
    env,
  });
  if ((result.status ?? 1) !== 0) failed = true;
}

console.log("\n=== Phase 3 gate summary ===");
console.log(failed ? "FAIL     phase3" : "PASS     phase3");
process.exit(failed ? 1 : 0);
