import { connectDB, disconnectDB } from "../config/index.js";
import { School } from "../models/index.js";

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
