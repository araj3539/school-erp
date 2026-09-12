import { describe, expect, it } from "vitest";
import { planPaymentAllocation } from "./paymentAllocationService.js";

describe("payment allocation planning", () => {
  it("allocates FIFO across fee items and returns an unallocated remainder", () => {
    const result = planPaymentAllocation(1000, [
      { feeItemId: "a", balance: 300 },
      { feeItemId: "b", balance: 500 },
      { feeItemId: "c", balance: 100 }
    ]);
    expect(result.rows).toEqual([{ feeItemId: "a", amount: 300 }, { feeItemId: "b", amount: 500 }, { feeItemId: "c", amount: 100 }]);
    expect(result.allocated).toBe(900);
    expect(result.unallocated).toBe(100);
  });

  it("respects existing allocations when planning the remaining payment", () => {
    const result = planPaymentAllocation(1000, [{ feeItemId: "a", balance: 700 }, { feeItemId: "b", balance: 500 }], 600);
    expect(result.rows).toEqual([{ feeItemId: "a", amount: 400 }]);
    expect(result.allocated).toBe(1000);
    expect(result.unallocated).toBe(0);
  });

  it("skips zero/negative candidates and rejects invalid existing allocation", () => {
    expect(planPaymentAllocation(500, [{ feeItemId: "a", balance: 0 }, { feeItemId: "b", balance: 250 }]).rows).toEqual([{ feeItemId: "b", amount: 250 }]);
    expect(() => planPaymentAllocation(500, [], 600)).toThrow();
  });
});
