import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnvFile(resolve(__dirname, "../../.env"));
try { loadEnvFile(resolve(__dirname, "../../../.env")); } catch {
  // The repository-level .env is optional when the server .env is present.
}

const { connectDB, disconnectDB } = await import("../config/index.js");
const { PaymentWebhookEvent, SaaSProduct, SaaSPlan, Subscription } = await import("../models/index.js");

async function main(): Promise<void> {
  await connectDB();
  try {
    await SaaSProduct.collection.createIndex({ code: 1, version: 1 }, { unique: true, name: "code_1_version_1" });
    await SaaSProduct.collection.createIndex({ code: 1, status: 1 }, { name: "code_1_status_1" });
    await SaaSPlan.collection.createIndex({ productId: 1, code: 1, version: 1 }, { unique: true, name: "productId_1_code_1_version_1" });
    await SaaSPlan.collection.createIndex({ productId: 1, status: 1 }, { name: "productId_1_status_1" });
    await Subscription.collection.createIndex({ schoolId: 1 }, { unique: true, name: "schoolId_1_unique" });
    await Subscription.collection.createIndex({ status: 1, currentPeriodEnd: 1 }, { name: "status_1_currentPeriodEnd_1" });
    await Subscription.collection.createIndex({ planId: 1, status: 1 }, { name: "planId_1_status_1" });
    await Subscription.collection.createIndex({ provider: 1, providerSubscriptionId: 1 }, { unique: true, sparse: true, name: "provider_1_providerSubscriptionId_1_unique" });
    await PaymentWebhookEvent.collection.createIndex({ provider: 1, eventId: 1 }, { unique: true });
    await PaymentWebhookEvent.collection.createIndex({ provider: 1, receivedAt: -1 });
    await PaymentWebhookEvent.collection.createIndex({ provider: 1, status: 1, processingAt: 1 });
    console.log("Billing catalog, subscription, and webhook indexes verified");
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  console.error("Billing catalog migration failed:", error);
  process.exitCode = 1;
});
