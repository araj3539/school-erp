import { describe, expect, it } from "vitest";
import { Exam } from "./Exam.js";
import { ExamResult } from "./ExamResult.js";

describe("Phase 5 academic result models", () => {
  it("rejects overlapping grade ranges", async () => {
    const exam = new Exam({ startDate: "2026-09-01", endDate: "2026-09-02", subjects: [{ subjectId: "507f1f77bcf86cd799439011", maxMarks: 100, passMarks: 40 }], gradeRules: [{ grade: "A", minPercentage: 80, maxPercentage: 100 }, { grade: "B", minPercentage: 70, maxPercentage: 85 }] });
    await expect(exam.validate()).rejects.toThrow("Grade ranges must not overlap");
  });
  it("rejects pass marks above maximum marks", async () => {
    const exam = new Exam({ startDate: "2026-09-01", endDate: "2026-09-02", subjects: [{ subjectId: "507f1f77bcf86cd799439011", maxMarks: 50, passMarks: 60 }], gradeRules: [{ grade: "A", minPercentage: 0, maxPercentage: 100 }] });
    await expect(exam.validate()).rejects.toThrow("Pass marks cannot exceed max marks");
  });
  it("has a unique exam/student result index", () => {
    const indexes = ExamResult.schema.indexes();
    expect(indexes.some(([fields, options]) => fields.schoolId === 1 && fields.examId === 1 && fields.studentId === 1 && (options as any)?.unique)).toBe(true);
  });
});
