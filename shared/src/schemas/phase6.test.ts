import { describe, expect, it } from "vitest";
import { CreateHomeworkSchema, HomeworkQuerySchema } from "./phase6";

const ids = {
  classId: "507f1f77bcf86cd799439011",
  sectionId: "507f1f77bcf86cd799439012",
  subjectId: "507f1f77bcf86cd799439013",
  academicYearId: "507f1f77bcf86cd799439014",
};

describe("phase 6 homework schemas", () => {
  it("accepts a valid homework assignment", () => {
    const result = CreateHomeworkSchema.safeParse({
      title: "Chapter 3 exercises",
      description: "Complete questions 1-10.",
      ...ids,
      assignedDate: "2026-09-03",
      dueDate: "2026-09-05",
      attachments: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a due date before the assigned date", () => {
    const result = CreateHomeworkSchema.safeParse({
      title: "Invalid homework",
      ...ids,
      assignedDate: "2026-09-05",
      dueDate: "2026-09-03",
    });
    expect(result.success).toBe(false);
  });

  it("limits attachment count", () => {
    const attachments = Array.from({ length: 11 }, (_, i) => ({ name: `file-${i}.pdf`, url: `https://example.com/${i}.pdf` }));
    const result = CreateHomeworkSchema.safeParse({
      title: "Too many attachments",
      ...ids,
      assignedDate: "2026-09-03",
      dueDate: "2026-09-03",
      attachments,
    });
    expect(result.success).toBe(false);
  });

  it("coerces pagination query values", () => {
    const result = HomeworkQuerySchema.parse({ page: "2", limit: "25", classId: ids.classId });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(25);
  });
});
