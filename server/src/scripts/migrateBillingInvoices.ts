import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnvFile(resolve(__dirname, "../../.env"));
try { loadEnvFile(resolve(__dirname, "../../../.env")); } catch {
  // The repository-level .env is optional when the server .env is present.
}

const { connectDB, disconnectDB } = await import("../config/index.js");
const { SaaSInvoice } = await import("../models/index.js");

async function main(): Promise<void> {
  await connectDB();
  try {
    await SaaSInvoice.collection.createIndex({ schoolId: 1, issuedAt: -1 }, { name: "schoolId_1_issuedAt_-1" });
    await SaaSInvoice.collection.createIndex({ schoolId: 1, status: 1, dueAt: 1 }, { name: "schoolId_1_status_1_dueAt_1" });
    await SaaSInvoice.collection.createIndex({ subscriptionId: 1, periodStart: 1, periodEnd: 1 }, { unique: true, name: "subscriptionId_1_periodStart_1_periodEnd_1_unique" });
    await SaaSInvoice.collection.createIndex({ provider: 1, providerPaymentId: 1 }, { unique: true, sparse: true, name: "provider_1_providerPaymentId_1_unique" });
    console.log("SaaS invoice indexes verified");
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  console.error("Billing invoice migration failed:", error);
  process.exitCode = 1;
});
