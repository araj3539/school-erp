import { describe, expect, it } from "vitest";
import { PaymentWebhookEvent } from "./PaymentWebhookEvent.js";

describe("payment webhook event model", () => {
  it("enforces provider event id uniqueness and exposes a processing lease index", () => {
    const indexes = PaymentWebhookEvent.schema.indexes();
    const replayIndex = indexes.find(([keys]) => keys.provider === 1 && keys.eventId === 1);
    const leaseIndex = indexes.find(([keys]) => keys.provider === 1 && keys.status === 1 && keys.processingAt === 1);

    expect(replayIndex?.[1]?.unique).toBe(true);
    expect(leaseIndex?.[0]).toEqual({ provider: 1, status: 1, processingAt: 1 });
  });
});
