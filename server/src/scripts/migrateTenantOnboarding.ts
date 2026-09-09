import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnvFile(resolve(__dirname, "../../.env"));
try { loadEnvFile(resolve(__dirname, "../../../.env")); } catch {
  // The repository-level .env is optional when the server .env is present.
}

const { connectDB, disconnectDB } = await import("../config/index.js");
const { School, TenantProvisioning } = await import("../models/index.js");

async function main(): Promise<void> {
  await connectDB();
  try {
    const duplicateEmails = await School.aggregate([
      { $group: { _id: "$email", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $limit: 1 },
    ]);
    if (duplicateEmails.length > 0) throw new Error("Cannot create unique school email index while duplicate tenant emails exist");

    await School.collection.createIndex({ email: 1 }, { unique: true, name: "email_1" });
    await TenantProvisioning.collection.createIndex({ idempotencyKey: 1 }, { unique: true, name: "idempotencyKey_1" });
    await TenantProvisioning.collection.createIndex({ schoolId: 1 }, { unique: true, name: "schoolId_1" });
    console.log("Tenant onboarding indexes verified");
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  console.error("Tenant onboarding migration failed:", error);
  process.exitCode = 1;
});
