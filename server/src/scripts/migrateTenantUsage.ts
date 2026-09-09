import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnvFile(resolve(__dirname, "../../.env"));
try { loadEnvFile(resolve(__dirname, "../../../.env")); } catch {
  // The repository-level .env is optional when the server .env is present.
}

const { connectDB, disconnectDB } = await import("../config/index.js");
const { School, TenantLimit, TenantUsage } = await import("../models/index.js");
const { reconcileTenantUsage } = await import("../services/tenantUsage.js");

async function main(): Promise<void> {
  await connectDB();
  try {
    await TenantUsage.collection.createIndex({ schoolId: 1 }, { unique: true, name: "schoolId_1_unique" });
    await TenantLimit.collection.createIndex({ schoolId: 1, dimension: 1 }, { unique: true, name: "schoolId_1_dimension_1_unique" });

    const schools = await School.find({}).select("_id").lean();
    for (const school of schools) await reconcileTenantUsage(school._id.toString());
    console.log(`Tenant usage indexes verified; reconciled ${schools.length} tenants`);
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  console.error("Tenant usage migration failed:", error);
  process.exitCode = 1;
});
