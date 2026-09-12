import { describe, expect, it } from "vitest";
import { Attendance } from "./Attendance.js";

describe("Attendance lifecycle", () => {
  it("requires a lock timestamp for locked attendance", async () => {
    const attendance = new Attendance({ date: new Date("2026-09-10"), classId: "507f1f77bcf86cd799439011", sectionId: "507f1f77bcf86cd799439012", schoolId: "507f1f77bcf86cd799439013", records: [{ studentId: "507f1f77bcf86cd799439014", status: "present" }], markedBy: "507f1f77bcf86cd799439015", lifecycle: "LOCKED" });
    await expect(attendance.validate()).rejects.toThrow("Locked attendance must have a lock timestamp");
  });

  it("defaults new attendance to submitted", () => {
    const attendance = new Attendance({ date: new Date("2026-09-10"), classId: "507f1f77bcf86cd799439011", sectionId: "507f1f77bcf86cd799439012", schoolId: "507f1f77bcf86cd799439013", records: [], markedBy: "507f1f77bcf86cd799439015" });
    expect(attendance.lifecycle).toBe("SUBMITTED");
  });
});
