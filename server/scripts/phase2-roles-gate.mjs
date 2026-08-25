import "dotenv/config";
import { spawnSync } from "node:child_process";
import path from "node:path";

const required = ["E2E_API_URL", "E2E_FIXTURE_PASSWORD"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Phase 2 role gate missing variables: ${missing.join(", ")}`);
  process.exit(2);
}

const playwrightCli = path.resolve("..", "node_modules", "playwright", "cli.js");
const result = spawnSync(process.execPath, [playwrightCli, "test", "e2e/phase2-roles.spec.ts", "--workers=1"], {
  stdio: "inherit",
  cwd: process.cwd(),
  env: process.env,
});

if (result.error) console.error("Phase 2 role gate Playwright launch error:", result.error.message);
process.exit(result.status ?? 1);
