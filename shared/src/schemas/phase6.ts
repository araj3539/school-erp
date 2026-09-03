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

export type HomeworkAttachment = z.infer<typeof HomeworkAttachmentSchema>;
export type CreateHomework = z.infer<typeof CreateHomeworkSchema>;
export type UpdateHomework = z.infer<typeof UpdateHomeworkSchema>;
export type HomeworkQuery = z.infer<typeof HomeworkQuerySchema>;
