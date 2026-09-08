import { describe, expect, it, vi } from "vitest";
import crypto from "node:crypto";

describe("payment provider security", () => {
  it("accepts only the exact Razorpay checkout HMAC", async () => {
    vi.stubEnv("RAZORPAY_KEY_SECRET", "test-secret");
    vi.resetModules();
    const { verifyRazorpayCheckoutSignature } = await import("./paymentProvider.js");
    const expected = crypto.createHmac("sha256", "test-secret").update("order_test|pay_test").digest("hex");
    expect(verifyRazorpayCheckoutSignature({ orderId: "order_test", paymentId: "pay_test", signature: expected })).toBe(true);
    expect(verifyRazorpayCheckoutSignature({ orderId: "order_test", paymentId: "pay_test", signature: `${expected.slice(0, -1)}0` })).toBe(false);
    vi.unstubAllEnvs();
  });

  it("rejects a tampered webhook body", async () => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "webhook-secret");
    vi.resetModules();
    const { verifyRazorpayWebhookSignature } = await import("./paymentProvider.js");
    const raw = Buffer.from('{"event":"order.paid"}');
    const signature = crypto.createHmac("sha256", "webhook-secret").update(raw).digest("hex");
    expect(verifyRazorpayWebhookSignature(raw, signature)).toBe(true);
    expect(verifyRazorpayWebhookSignature(Buffer.from('{"event":"payment.captured"}'), signature)).toBe(false);
    vi.unstubAllEnvs();
  });
});
