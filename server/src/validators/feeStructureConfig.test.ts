import { describe, expect, it } from "vitest";
import { CreateFlexibleFeeStructureSchema, UpdateFlexibleFeeStructureSchema } from "./feeStructure.js";

const ids = { classId: "507f1f77bcf86cd799439011", academicYear: "507f1f77bcf86cd799439012" };

describe("configurable fee structure validation", () => {
  it("accepts custom concession rules and late fee policy", () => {
    const value = CreateFlexibleFeeStructureSchema.parse({
      ...ids,
      feeType: "monthly",
      amount: 10000,
      concessionRules: [{ name: "Sibling", code: "SIBLING", valueType: "percent", value: 15, active: true }],
      lateFeePolicy: { enabled: true, graceDays: 7, valueType: "percent", value: 2, maxAmount: 500 }
    });
    expect(value.concessionRules[0].value).toBe(15);
    expect(value.lateFeePolicy.graceDays).toBe(7);
  });

  it("rejects concession rules above policy limits", () => {
    expect(() => CreateFlexibleFeeStructureSchema.parse({
      ...ids, feeType: "monthly", amount: 10000,
      concessionRules: [{ name: "Invalid", code: "INVALID", valueType: "percent", value: 101 }]
    })).toThrow();
  });

  it("keeps update validation for incompatible fixed and percentage concessions", () => {
    expect(() => UpdateFlexibleFeeStructureSchema.parse({ amount: 10000, concessionPercent: 10, concessionAmount: 100 })).toThrow();
  });

  it("rejects installments that do not match the fee amount", () => {
    expect(() => CreateFlexibleFeeStructureSchema.parse({
      ...ids, feeType: "monthly", amount: 10000,
      installments: [{ name: "Term 1", amount: 4000, dueDate: "2026-10-01T00:00:00.000Z" }]
    })).toThrow();
  });
});
