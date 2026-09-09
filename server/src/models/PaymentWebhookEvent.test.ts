import { describe, expect, it } from "vitest";
import { PaymentWebhookEvent } from "./PaymentWebhookEvent.js";

describe("payment webhook event model", () => {
  it("enforces provider event id uniqueness and exposes a processing lease index", () => {
    const indexes = PaymentWebhookEvent.schema.indexes();
    expect(indexes).toContainEqual([
      { provider: 1, eventId: 1 },
      { unique: true },
    ]);
    expect(indexes).toContainEqual([
      { provider: 1, status: 1, processingAt: 1 },
      {},
    ]);
  });
});
