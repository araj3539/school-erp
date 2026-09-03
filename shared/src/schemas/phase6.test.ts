import { describe, expect, it } from "vitest";
import { CreateHomeworkSchema, HomeworkAttachmentListSchema, HomeworkQuerySchema, CreateNoticeSchema, NoticeQuerySchema, CreateTimetableSchema, TimetableQuerySchema } from "./phase6.js";
const ids = { classId: "507f1f77bcf86cd799439011", sectionId: "507f1f77bcf86cd799439012", subjectId: "507f1f77bcf86cd799439013", academicYearId: "507f1f77bcf86cd799439014", teacherId: "507f1f77bcf86cd799439015" };

describe("phase 6 homework schemas", () => {
  it("accepts homework without public attachment URLs", () => expect(CreateHomeworkSchema.safeParse({ title: "Chapter 3 exercises", ...ids, assignedDate: "2026-09-03", dueDate: "2026-09-05" }).success).toBe(true));
  it("rejects a due date before assigned date", () => expect(CreateHomeworkSchema.safeParse({ title: "Invalid", ...ids, assignedDate: "2026-09-05", dueDate: "2026-09-03" }).success).toBe(false));
  it("limits attachment metadata to ten files", () => { const attachments = Array.from({ length: 11 }, (_, i) => ({ _id: ids.classId, name: `file-${i}.pdf` })); expect(HomeworkAttachmentListSchema.safeParse(attachments).success).toBe(false); });
  it("rejects public attachment URLs", () => expect(HomeworkAttachmentListSchema.safeParse([{ _id: ids.classId, name: "worksheet.pdf", url: "https://example.com/worksheet.pdf" }]).success).toBe(false));
  it("coerces pagination query values", () => { const result = HomeworkQuerySchema.parse({ page: "2", limit: "25", classId: ids.classId }); expect(result.page).toBe(2); expect(result.limit).toBe(25); });
});

describe("phase 6 notice schemas", () => {
  it("accepts a scheduled school notice", () => expect(CreateNoticeSchema.safeParse({ title: "Parent meeting", message: "Meeting on Friday.", audience: "school", publishAt: "2026-09-04T10:00:00Z", expiresAt: "2026-09-05T10:00:00Z" }).success).toBe(true));
  it("requires class and section for a section notice", () => expect(CreateNoticeSchema.safeParse({ title: "Section notice", message: "Test", audience: "section", classId: ids.classId }).success).toBe(false));
  it("rejects a school notice with class targeting", () => expect(CreateNoticeSchema.safeParse({ title: "Bad target", message: "Test", audience: "school", classId: ids.classId }).success).toBe(false));
  it("rejects expiry before publication", () => expect(CreateNoticeSchema.safeParse({ title: "Bad dates", message: "Test", audience: "school", publishAt: "2026-09-05T10:00:00Z", expiresAt: "2026-09-04T10:00:00Z" }).success).toBe(false));
  it("coerces includeUnpublished", () => expect(NoticeQuerySchema.parse({ page: "1", limit: "20", includeUnpublished: "true" }).includeUnpublished).toBe(true));
});

describe("phase 6 timetable schemas", () => {
  it("accepts a valid period", () => expect(CreateTimetableSchema.safeParse({ ...ids, dayOfWeek: 1, startTime: "09:00", endTime: "09:45" }).success).toBe(true));
  it("rejects an invalid time range", () => expect(CreateTimetableSchema.safeParse({ ...ids, dayOfWeek: 1, startTime: "10:00", endTime: "09:45" }).success).toBe(false));
  it("rejects invalid day/time formats", () => expect(CreateTimetableSchema.safeParse({ ...ids, dayOfWeek: 8, startTime: "9:00", endTime: "09:45" }).success).toBe(false));
  it("coerces timetable query values", () => { const result = TimetableQuerySchema.parse({ page: "2", limit: "50", dayOfWeek: "3" }); expect(result.page).toBe(2); expect(result.dayOfWeek).toBe(3); });
});
