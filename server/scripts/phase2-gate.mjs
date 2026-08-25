import { spawnSync } from "node:child_process";

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
  const result = spawnSync("npm", ["run", script], {
    stdio: "inherit",
    shell: process.platform === "win32",
    cwd: process.cwd(),
    env: process.env,
  });
  const code = result.status ?? 1;
  const state = code === 0 ? "PASS" : code === 2 ? "BLOCKED" : "FAIL";
  results.push({ name, code, state });
}

console.log("\n=== Phase 2 gate summary ===");
for (const result of results) console.log(`${result.state.padEnd(8)} ${result.name} (exit ${result.code})`);

process.exit(results.some(({ state }) => state === "FAIL") ? 1 : 0);
