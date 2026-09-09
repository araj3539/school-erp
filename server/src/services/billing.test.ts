import { describe, expect, it } from "vitest";
import { getNextSubscriptionStatus } from "./billing.js";

describe("subscription state machine", () => {
  it("accepts every supported transition", () => {
    expect(getNextSubscriptionStatus("trialing", "activate")).toBe("active");
    expect(getNextSubscriptionStatus("trialing", "cancel")).toBe("cancelled");
    expect(getNextSubscriptionStatus("active", "mark_past_due")).toBe("past_due");
    expect(getNextSubscriptionStatus("active", "suspend")).toBe("suspended");
    expect(getNextSubscriptionStatus("active", "cancel")).toBe("cancelled");
    expect(getNextSubscriptionStatus("past_due", "recover")).toBe("active");
    expect(getNextSubscriptionStatus("past_due", "suspend")).toBe("suspended");
    expect(getNextSubscriptionStatus("suspended", "recover")).toBe("active");
    expect(getNextSubscriptionStatus("suspended", "expire")).toBe("expired");
    expect(getNextSubscriptionStatus("cancelled", "expire")).toBe("expired");
  });

  it("rejects invalid transitions", () => {
    expect(() => getNextSubscriptionStatus("expired", "recover")).toThrow(/Invalid subscription transition/);
    expect(() => getNextSubscriptionStatus("cancelled", "activate")).toThrow(/Invalid subscription transition/);
    expect(() => getNextSubscriptionStatus("active", "recover")).toThrow(/Invalid subscription transition/);
    expect(() => getNextSubscriptionStatus("trialing", "recover")).toThrow(/Invalid subscription transition/);
  });
});
