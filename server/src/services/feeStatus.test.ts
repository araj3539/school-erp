import { describe, it, expect } from "vitest";
import { FeeStatus } from "@school-erp/shared";
import { startOfUtcDay, isFeeOverdue, computeEffectiveFeeStatus } from "./feeStatus.js";

describe("feeStatus", () => {
  const now = new Date(Date.UTC(2026, 9, 30, 12, 0, 0));

  it("startOfUtcDay normalizes to UTC midnight", () => {
    const start = startOfUtcDay(now);
    expect(start).toEqual(new Date(Date.UTC(2026, 9, 30, 0, 0, 0)));
  });

  it("does not mark a fee overdue before its due date ends", () => {
    expect(isFeeOverdue("pending", new Date(Date.UTC(2026, 9, 30, 0, 0, 0)), 100, now)).toBe(false);
    expect(isFeeOverdue("pending", new Date(Date.UTC(2026, 9, 30, 23, 59, 59, 999)), 100, now)).toBe(false);
  });

  it("marks a pending/partial fee overdue once the due day has passed", () => {
    expect(isFeeOverdue("pending", new Date(Date.UTC(2026, 9, 29, 0, 0, 0)), 100, now)).toBe(true);
    expect(isFeeOverdue("partial", new Date(Date.UTC(2026, 9, 29, 0, 0, 0)), 100, now)).toBe(true);
  });

  it("is not overdue when balance is zero or status is paid/waived", () => {
    expect(isFeeOverdue("pending", new Date(Date.UTC(2026, 9, 29, 0, 0, 0)), 0, now)).toBe(false);
    expect(isFeeOverdue("paid", new Date(Date.UTC(2026, 9, 29, 0, 0, 0)), 100, now)).toBe(false);
    expect(isFeeOverdue("waived", new Date(Date.UTC(2026, 9, 29, 0, 0, 0)), 100, now)).toBe(false);
  });

  it("computeEffectiveFeeStatus derives overdue but preserves other statuses", () => {
    expect(computeEffectiveFeeStatus("pending", new Date(Date.UTC(2026, 9, 29, 0, 0, 0)), 100, now)).toBe(FeeStatus.OVERDUE);
    expect(computeEffectiveFeeStatus("paid", new Date(Date.UTC(2026, 9, 29, 0, 0, 0)), 0, now)).toBe(FeeStatus.PAID);
    expect(computeEffectiveFeeStatus("partial", new Date(Date.UTC(2026, 9, 30, 0, 0, 0)), 50, now)).toBe(FeeStatus.PARTIAL);
  });
});
