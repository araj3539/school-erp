import { describe, expect, it } from "vitest";
import { evaluateSubscriptionLifecycle } from "./subscriptionLifecycle.js";

const date = (value: string) => new Date(value);

describe("subscription lifecycle policy", () => {
  it("allows full access during an unexpired trial", () => {
    expect(evaluateSubscriptionLifecycle({ status: "trialing", trialEndsAt: date("2030-01-02"), currentPeriodEnd: date("2030-02-01") }, date("2030-01-01")).access).toBe("full");
  });

  it("expires an elapsed trial deterministically", () => {
    const result = evaluateSubscriptionLifecycle({ status: "trialing", trialEndsAt: date("2030-01-01"), currentPeriodEnd: date("2030-02-01") }, date("2030-01-02"));
    expect(result.effectiveStatus).toBe("expired");
    expect(result.mutationsAllowed).toBe(false);
    expect(result.access).toBe("none");
  });

  it("keeps a scheduled active cancellation recoverable until cancelAt", () => {
    const result = evaluateSubscriptionLifecycle({ status: "active", cancelAt: date("2030-02-01"), currentPeriodEnd: date("2030-03-01") }, date("2030-01-15"));
    expect(result.effectiveStatus).toBe("active");
    expect(result.access).toBe("full");
    expect(result.cancellationScheduled).toBe(true);
  });

  it("enters grace during an unpaid period but blocks mutations", () => {
    const result = evaluateSubscriptionLifecycle({ status: "past_due", currentPeriodEnd: date("2030-02-01") }, date("2030-01-15"));
    expect(result.effectiveStatus).toBe("past_due");
    expect(result.access).toBe("grace");
    expect(result.mutationsAllowed).toBe(false);
  });

  it("suspends access after the grace period", () => {
    const result = evaluateSubscriptionLifecycle({ status: "past_due", currentPeriodEnd: date("2030-01-01") }, date("2030-01-02"));
    expect(result.effectiveStatus).toBe("suspended");
    expect(result.access).toBe("none");
    expect(result.mutationsAllowed).toBe(false);
  });

  it("does not grant access to terminal states", () => {
    for (const status of ["suspended", "cancelled", "expired"] as const) {
      const result = evaluateSubscriptionLifecycle({ status, currentPeriodEnd: date("2030-02-01") }, date("2030-01-01"));
      expect(result.access).toBe("none");
      expect(result.mutationsAllowed).toBe(false);
    }
  });
});
