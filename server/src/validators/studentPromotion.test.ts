import { describe, expect, it } from "vitest";
import { StudentPromotionExecuteSchema, StudentPromotionSchema } from "./studentPromotion.js";

const id = "507f1f77bcf86cd799439011";

describe("student promotion validators", () => {
  it("accepts a scoped promotion preview", () => {
    expect(StudentPromotionSchema.safeParse({ sourceClassId: id, targetClassId: "507f1f77bcf86cd799439012", targetSectionId: id, studentIds: [id] }).success).toBe(true);
  });
  it("requires explicit confirmation for execution", () => {
    expect(StudentPromotionExecuteSchema.safeParse({ sourceClassId: id, targetClassId: "507f1f77bcf86cd799439012", confirm: false }).success).toBe(false);
    expect(StudentPromotionExecuteSchema.safeParse({ sourceClassId: id, targetClassId: "507f1f77bcf86cd799439012", confirm: true }).success).toBe(true);
  });
});
