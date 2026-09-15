import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { StudentFamily } from "./StudentFamily.js";

describe("StudentFamily invariants", () => {
  const objectId = () => new mongoose.Types.ObjectId();

  it("requires exactly two students", async () => {
    const family = new StudentFamily({
      schoolId: objectId(),
      studentIds: [objectId()],
      createdBy: objectId()
    });
    await expect(family.validate()).rejects.toThrow("exactly two students");
  });

  it("rejects a self/duplicate relationship", async () => {
    const studentId = objectId();
    const family = new StudentFamily({
      schoolId: objectId(),
      studentIds: [studentId, studentId],
      createdBy: objectId()
    });
    await expect(family.validate()).rejects.toThrow("duplicated");
  });

  it("accepts a distinct two-student relationship", async () => {
    const family = new StudentFamily({
      schoolId: objectId(),
      studentIds: [objectId(), objectId()],
      relationship: "half_sibling",
      createdBy: objectId()
    });
    await expect(family.validate()).resolves.toBeUndefined();
  });

  it("exposes the school-scoped unique pair index", () => {
    const uniqueIndexes = StudentFamily.schema.indexes().filter(([, options]) => options.unique);
    expect(uniqueIndexes.some(([keys]) => keys.schoolId === 1 && keys.studentIds === 1)).toBe(true);
  });
});
