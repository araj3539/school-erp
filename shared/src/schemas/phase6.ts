import { z } from "zod";
import { DateOnlySchema, ObjectIdSchema, PaginationSchema } from "./index.js";

export const HomeworkAttachmentSchema = z.object({
  name: z.string().trim().min(1).max(200),
  url: z.string().url().max(2000),
  size: z.number().int().nonnegative().optional(),
  mimeType: z.string().trim().max(100).optional(),
});

const HomeworkFieldsSchema = z.object({
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().max(5000).optional(),
  classId: ObjectIdSchema,
  sectionId: ObjectIdSchema.optional(),
  subjectId: ObjectIdSchema,
  academicYearId: ObjectIdSchema,
  assignedDate: DateOnlySchema,
  dueDate: DateOnlySchema,
  attachments: z.array(HomeworkAttachmentSchema).max(10).default([]),
});

export const CreateHomeworkSchema = HomeworkFieldsSchema.superRefine((value, ctx) => {
  if (value.assignedDate > value.dueDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dueDate"], message: "Due date must be on or after assigned date" });
  }
});

export const UpdateHomeworkSchema = HomeworkFieldsSchema.partial().superRefine((value, ctx) => {
  if (value.assignedDate && value.dueDate && value.assignedDate > value.dueDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dueDate"], message: "Due date must be on or after assigned date" });
  }
});

export const HomeworkQuerySchema = PaginationSchema.extend({
  classId: ObjectIdSchema.optional(),
  sectionId: ObjectIdSchema.optional(),
  subjectId: ObjectIdSchema.optional(),
  academicYearId: ObjectIdSchema.optional(),
  assignedDate: DateOnlySchema.optional(),
  dueDate: DateOnlySchema.optional(),
});

export const NoticeAudienceSchema = z.enum(["school", "class", "section"]);
export const NoticePrioritySchema = z.enum(["low", "normal", "high", "urgent"]);

const NoticeFieldsSchema = z.object({
  title: z.string().trim().min(2).max(160),
  message: z.string().trim().min(1).max(10000),
  priority: NoticePrioritySchema.default("normal"),
  audience: NoticeAudienceSchema.default("school"),
  classId: ObjectIdSchema.optional(),
  sectionId: ObjectIdSchema.optional(),
  publishAt: z.coerce.date().default(() => new Date()),
  expiresAt: z.coerce.date().optional(),
});

const validateNoticeDatesAndTarget = (value: any, ctx: z.RefinementCtx) => {
  if (value.expiresAt && value.expiresAt <= value.publishAt) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["expiresAt"], message: "Expiry must be after publication time" });
  }
  if (value.audience === "school" && (value.classId || value.sectionId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["audience"], message: "School notices cannot target a class or section" });
  }
  if (value.audience === "class" && (!value.classId || value.sectionId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["classId"], message: "Class notices require a class and no section" });
  }
  if (value.audience === "section" && (!value.classId || !value.sectionId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sectionId"], message: "Section notices require a class and section" });
  }
};

export const CreateNoticeSchema = NoticeFieldsSchema.superRefine(validateNoticeDatesAndTarget);
export const UpdateNoticeSchema = NoticeFieldsSchema.partial().superRefine(validateNoticeDatesAndTarget);
export const NoticeQuerySchema = PaginationSchema.extend({
  priority: NoticePrioritySchema.optional(),
  includeUnpublished: z.coerce.boolean().default(false),
});

export type HomeworkAttachment = z.infer<typeof HomeworkAttachmentSchema>;
export type CreateHomework = z.infer<typeof CreateHomeworkSchema>;
export type UpdateHomework = z.infer<typeof UpdateHomeworkSchema>;
export type HomeworkQuery = z.infer<typeof HomeworkQuerySchema>;
export type CreateNotice = z.infer<typeof CreateNoticeSchema>;
export type UpdateNotice = z.infer<typeof UpdateNoticeSchema>;
export type NoticeQuery = z.infer<typeof NoticeQuerySchema>;
