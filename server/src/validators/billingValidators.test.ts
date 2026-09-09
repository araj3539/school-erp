import { describe, expect, it } from "vitest";
import { CreateSubscriptionSchema, TransitionSubscriptionSchema } from "./billingValidators.js";

describe("billing validators", () => {
  it("does not accept subscription status from create requests", () => {
    const result = CreateSubscriptionSchema.safeParse({
      schoolId: "66c000000000000000000001",
      planId: "66c000000000000000000002",
      status: "active",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).not.toHaveProperty("status");
  });

  it("accepts commands rather than arbitrary target statuses", () => {
    expect(TransitionSubscriptionSchema.safeParse({ event: "activate" }).success).toBe(true);
    expect(TransitionSubscriptionSchema.safeParse({ status: "active" }).success).toBe(false);
    expect(TransitionSubscriptionSchema.safeParse({ event: "set_active" }).success).toBe(false);
  });
});
