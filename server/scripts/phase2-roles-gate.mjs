import { spawnSync } from "node:child_process";

const required = ["E2E_API_URL", "E2E_FIXTURE_PASSWORD"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Phase 2 role gate missing variables: ${missing.join(", ")}`);
  process.exit(2);
}

const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["playwright", "test", "e2e/phase2-roles.spec.ts", "--workers=1"],
  { stdio: "inherit", cwd: process.cwd(), env: process.env }
);
process.exit(result.status ?? 1);
