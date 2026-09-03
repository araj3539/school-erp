import { describe, expect, it } from "vitest";
import { CreateHomeworkSchema, HomeworkQuerySchema, CreateNoticeSchema, NoticeQuerySchema } from "./phase6.js";

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

describe("phase 6 notice schemas", () => {
  it("accepts a scheduled school notice", () => {
    const result = CreateNoticeSchema.safeParse({
      title: "Parent meeting",
      message: "Meeting on Friday.",
      audience: "school",
      publishAt: "2026-09-04T10:00:00Z",
      expiresAt: "2026-09-05T10:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("requires class and section for a section notice", () => {
    expect(CreateNoticeSchema.safeParse({ title: "Section notice", message: "Test", audience: "section", classId: ids.classId }).success).toBe(false);
  });

  it("rejects a school notice with class targeting", () => {
    expect(CreateNoticeSchema.safeParse({ title: "Bad target", message: "Test", audience: "school", classId: ids.classId }).success).toBe(false);
  });

  it("rejects expiry before publication", () => {
    expect(CreateNoticeSchema.safeParse({ title: "Bad dates", message: "Test", audience: "school", publishAt: "2026-09-05T10:00:00Z", expiresAt: "2026-09-04T10:00:00Z" }).success).toBe(false);
  });

  it("coerces includeUnpublished query values", () => {
    const result = NoticeQuerySchema.parse({ page: "1", limit: "20", includeUnpublished: "true" });
    expect(result.includeUnpublished).toBe(true);
  });
});
