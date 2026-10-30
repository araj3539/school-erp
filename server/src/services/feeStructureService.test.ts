import { describe, expect, it } from "vitest";
import { calculateConcession } from "./feeStructureService.js";

describe("calculateConcession", () => {
  it("applies a percent concession only", () => {
    expect(calculateConcession(1000, { concessionPercent: 10 })).toEqual({ discount: 100, totalDue: 900 });
  });

  it("applies a fixed concession only", () => {
    expect(calculateConcession(1000, { concessionAmount: 250 })).toEqual({ discount: 250, totalDue: 750 });
  });

  it("caps percent at 100 and treats negatives as zero", () => {
    expect(calculateConcession(1000, { concessionPercent: 150 })).toEqual({ discount: 1000, totalDue: 0 });
    expect(calculateConcession(1000, { concessionPercent: -10 })).toEqual({ discount: 0, totalDue: 1000 });
    expect(calculateConcession(1000, { concessionAmount: -50 })).toEqual({ discount: 0, totalDue: 1000 });
  });

  it("caps discount at the fee amount so totalDue never goes negative", () => {
    expect(calculateConcession(100, { concessionAmount: 500 })).toEqual({ discount: 100, totalDue: 0 });
  });

  it("rounds discount to two decimals", () => {
    expect(calculateConcession(100, { concessionPercent: 33.33 })).toEqual({ discount: 33.33, totalDue: 66.67 });
  });

  it("rejects non-finite or negative fee amounts", () => {
    expect(() => calculateConcession(-1, { concessionPercent: 10 })).toThrow("Fee amount must be a non-negative number");
    expect(() => calculateConcession(NaN as unknown as number, { concessionPercent: 10 })).toThrow("Fee amount must be a non-negative number");
  });
});
