import { describe, expect, it } from "vitest";
import { TeacherAbsence } from "../models/TeacherAbsence.js";

describe("TeacherAbsence", () => {
  it("requires a school, teacher and date", () => {
    const absence = new TeacherAbsence({ status: "reported", assignments: [], affectedTimetableIds: [] });
    const paths = absence.validateSync()?.errors || {};
    expect(paths.schoolId).toBeDefined();
    expect(paths.teacherId).toBeDefined();
    expect(paths.date).toBeDefined();
  });

  it("accepts a valid date and assignment status", () => {
    const absence = new TeacherAbsence({
      schoolId: "66c000000000000000000001",
      teacherId: "66c000000000000000000002",
      date: "2026-09-15",
      status: "partially_assigned",
      affectedTimetableIds: [],
      assignments: [],
      createdBy: "66c000000000000000000003",
    });
    expect(absence.validateSync()).toBeUndefined();
  });

  it("rejects malformed dates", () => {
    const absence = new TeacherAbsence({
      schoolId: "66c000000000000000000001",
      teacherId: "66c000000000000000000002",
      date: "15-09-2026",
      createdBy: "66c000000000000000000003",
    });
    expect(absence.validateSync()?.errors.date).toBeDefined();
  });
});
