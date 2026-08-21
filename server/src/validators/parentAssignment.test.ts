import { describe, expect, it } from "vitest";
import { ParentAssignmentSchema } from "./parentAssignment.js";

const id = "507f1f77bcf86cd799439011";

describe("ParentAssignmentSchema", () => {
  it("accepts up to five unique parent ids", () => {
    expect(ParentAssignmentSchema.parse({ parentIds: [id] })).toEqual({ parentIds: [id] });
  });

  it("rejects duplicate parent assignments", () => {
    expect(() => ParentAssignmentSchema.parse({ parentIds: [id, id] })).toThrow();
  });

  it("rejects more than five parents", () => {
    const ids = [1, 2, 3, 4, 5, 6].map((n) => `507f1f77bcf86cd7994390${n.toString().padStart(2, "0")}`);
    expect(() => ParentAssignmentSchema.parse({ parentIds: ids })).toThrow();
  });
});
