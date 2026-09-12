import { describe, expect, it } from "vitest";
import { Attendance } from "./Attendance.js";

describe("Attendance lifecycle", () => {
  it("defaults new attendance to submitted", () => {
    const attendance = new Attendance({ date: new Date("2026-09-10"), classId: "507f1f77bcf86cd799439011", sectionId: "507f1f77bcf86cd799439012", schoolId: "507f1f77bcf86cd799439013", records: [], markedBy: "507f1f77bcf86cd799439015" });
    expect(attendance.lifecycle).toBe("SUBMITTED");
  });

  it("declares all lifecycle states", () => {
    const lifecyclePath = Attendance.schema.path("lifecycle") as any;
    expect(lifecyclePath.enumValues).toEqual(["OPEN", "SUBMITTED", "LOCKED", "CORRECTION_REQUESTED", "CORRECTED"]);
  });

  it("declares correction history as an array", () => {
    expect(Attendance.schema.path("corrections")).toBeDefined();
  });
});
