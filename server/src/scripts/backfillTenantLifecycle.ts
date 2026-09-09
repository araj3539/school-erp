import mongoose from "mongoose";
import { env, connectDB } from "../config/index.js";
import { School } from "../models/index.js";

async function backfillTenantLifecycle(): Promise<void> {
  await connectDB();
  const result = await School.updateMany(
    { tenantStatus: { $exists: false } },
    { $set: { tenantStatus: "active" } },
  );
  await School.collection.createIndex({ tenantStatus: 1, createdAt: -1 }, { name: "tenantStatus_1_createdAt_-1" });
  console.log(`Tenant lifecycle backfill complete: matched=${result.matchedCount} modified=${result.modifiedCount}`);
}

backfillTenantLifecycle()
  .catch((error) => {
    console.error("Tenant lifecycle backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
