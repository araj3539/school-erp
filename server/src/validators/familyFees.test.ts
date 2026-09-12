import { describe, expect, it } from "vitest";
import { CreateStudentSiblingSchema } from "./studentFamily.js";
import { FeeItemAdjustmentSchema, CreateFeeHeadSchema } from "./feeHead.js";
import { CreateFlexibleFeeStructureSchema } from "./feeStructure.js";

describe("family and flexible fee validation", () => {
  it("accepts a valid sibling relationship", () => {
    expect(CreateStudentSiblingSchema.parse({ siblingId: "507f1f77bcf86cd799439011", relationship: "sibling" }).relationship).toBe("sibling");
  });

  it("rejects malformed sibling ids", () => {
    expect(() => CreateStudentSiblingSchema.parse({ siblingId: "not-an-id" })).toThrow();
  });

  it("requires a reason and accepts either amount or percentage for fee adjustments", () => {
    expect(() => FeeItemAdjustmentSchema.parse({ type: "discount", amount: 500, reason: "" })).toThrow();
    expect(FeeItemAdjustmentSchema.parse({ type: "discount", percent: 15, reason: "Sibling policy" }).percent).toBe(15);
    expect(() => FeeItemAdjustmentSchema.parse({ type: "discount", amount: 500, percent: 15, reason: "Conflict" })).toThrow();
  });

  it("supports custom fee head names and codes", () => {
    const head = CreateFeeHeadSchema.parse({ name: "Uniform Fee", code: "UNIFORM", kind: "one_time" });
    expect(head.code).toBe("UNIFORM");
  });

  it("supports configurable concession and late-fee policies", () => {
    const structure = CreateFlexibleFeeStructureSchema.parse({
      classId: "507f1f77bcf86cd799439011",
      academicYear: "507f1f77bcf86cd799439012",
      feeType: "monthly",
      amount: 12000,
      concessionRules: [{ name: "Scholarship", code: "SCHOLAR", valueType: "percent", value: 25 }],
      lateFeePolicy: { enabled: true, graceDays: 5, valueType: "fixed", value: 200 }
    });
    expect(structure.concessionRules).toHaveLength(1);
    expect(structure.lateFeePolicy.value).toBe(200);
  });
});
