import { describe, expect, it } from "vitest";
import { CreateStudentSiblingSchema } from "./studentFamily.js";
import { FeeItemAdjustmentSchema, CreateFeeHeadSchema } from "./feeHead.js";

describe("family and flexible fee validation", () => {
  it("accepts a valid sibling relationship", () => {
    expect(CreateStudentSiblingSchema.parse({ siblingId: "507f1f77bcf86cd799439011", relationship: "sibling" }).relationship).toBe("sibling");
  });

  it("rejects malformed sibling ids", () => {
    expect(() => CreateStudentSiblingSchema.parse({ siblingId: "not-an-id" })).toThrow();
  });

  it("requires a reason for fee adjustments", () => {
    expect(() => FeeItemAdjustmentSchema.parse({ type: "discount", amount: 500, reason: "" })).toThrow();
  });

  it("supports custom fee head names and codes", () => {
    const head = CreateFeeHeadSchema.parse({ name: "Uniform Fee", code: "UNIFORM", kind: "one_time" });
    expect(head.code).toBe("UNIFORM");
  });
});
