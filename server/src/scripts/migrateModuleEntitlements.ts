import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnvFile(resolve(__dirname, "../../.env"));
try { loadEnvFile(resolve(__dirname, "../../../.env")); } catch {
  // The repository-level .env is optional when the server .env is present.
}

const { connectDB, disconnectDB } = await import("../config/index.js");
const { ModuleEntitlement } = await import("../models/index.js");

async function main(): Promise<void> {
  await connectDB();
  try {
    await ModuleEntitlement.collection.createIndex({ schoolId: 1, moduleId: 1 }, { unique: true, name: "schoolId_1_moduleId_1" });
    await ModuleEntitlement.collection.createIndex({ schoolId: 1, enabled: 1 }, { name: "schoolId_1_enabled_1" });
    console.log("Module entitlement indexes verified");
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  console.error("Module entitlement migration failed:", error);
  process.exitCode = 1;
});
