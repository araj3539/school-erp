import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnvFile(resolve(__dirname, "../../.env"));
try { loadEnvFile(resolve(__dirname, "../../../.env")); } catch {
  // The repository-level .env is optional when the server .env is present.
}

const { connectDB, disconnectDB } = await import("../config/index.js");
const { School } = await import("../models/index.js");

async function main(): Promise<void> {
  await connectDB();
  try {
    const result = await School.updateMany(
      { tenantStatus: { $exists: false } },
      { $set: { tenantStatus: "active" } },
    );
    await School.collection.createIndex(
      { tenantStatus: 1, createdAt: -1 },
      { name: "tenantStatus_1_createdAt_-1" },
    );
    console.log(`Tenant lifecycle migration complete: ${result.modifiedCount} legacy tenants normalized`);
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  console.error("Tenant lifecycle migration failed:", error);
  process.exitCode = 1;
});
