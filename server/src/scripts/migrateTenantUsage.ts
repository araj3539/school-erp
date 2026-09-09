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

async function ensureIndexes(): Promise<void> {
  const usageDiff = await TenantUsage.diffIndexes();
  const limitDiff = await TenantLimit.diffIndexes();
  if (usageDiff.toDrop.length || usageDiff.toCreate.length) {
    await TenantUsage.syncIndexes();
  }
  if (limitDiff.toDrop.length || limitDiff.toCreate.length) {
    await TenantLimit.syncIndexes();
  }
}

async function main(): Promise<void> {
  await connectDB();
  try {
    await ensureIndexes();
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
