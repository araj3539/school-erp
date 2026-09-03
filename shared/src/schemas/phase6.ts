import { z } from "zod";
import { DateOnlySchema, ObjectIdSchema, PaginationSchema } from "./index.js";

export const HomeworkAttachmentSchema = z.object({
  _id: ObjectIdSchema,
  name: z.string().trim().min(1).max(200),
  size: z.number().int().nonnegative().optional(),
  mimeType: z.string().trim().max(100).optional(),
  uploadedAt: z.coerce.date().optional(),
}).strict();
export const HomeworkAttachmentListSchema = z.array(HomeworkAttachmentSchema).max(10);

const HomeworkFieldsSchema = z.object({ title: z.string().trim().min(2).max(150), description: z.string().trim().max(5000).optional(), classId: ObjectIdSchema, sectionId: ObjectIdSchema.optional(), subjectId: ObjectIdSchema, academicYearId: ObjectIdSchema, assignedDate: DateOnlySchema, dueDate: DateOnlySchema });
export const CreateHomeworkSchema = HomeworkFieldsSchema.superRefine((value, ctx) => { if (value.assignedDate > value.dueDate) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dueDate"], message: "Due date must be on or after assigned date" }); });
export const UpdateHomeworkSchema = HomeworkFieldsSchema.partial().superRefine((value, ctx) => { if (value.assignedDate && value.dueDate && value.assignedDate > value.dueDate) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dueDate"], message: "Due date must be on or after assigned date" }); });
export const HomeworkQuerySchema = PaginationSchema.extend({ classId: ObjectIdSchema.optional(), sectionId: ObjectIdSchema.optional(), subjectId: ObjectIdSchema.optional(), academicYearId: ObjectIdSchema.optional(), assignedDate: DateOnlySchema.optional(), dueDate: DateOnlySchema.optional() });

export const NoticeAudienceSchema = z.enum(["school", "class", "section"]);
export const NoticePrioritySchema = z.enum(["low", "normal", "high", "urgent"]);
const NoticeFieldsSchema = z.object({ title: z.string().trim().min(2).max(160), message: z.string().trim().min(1).max(10000), priority: NoticePrioritySchema.default("normal"), audience: NoticeAudienceSchema.default("school"), classId: ObjectIdSchema.optional(), sectionId: ObjectIdSchema.optional(), publishAt: z.coerce.date().default(() => new Date()), expiresAt: z.coerce.date().optional() });
const validateNoticeDatesAndTarget = (value: any, ctx: z.RefinementCtx) => { if (value.expiresAt && value.expiresAt <= value.publishAt) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["expiresAt"], message: "Expiry must be after publication time" }); if (value.audience === "school" && (value.classId || value.sectionId)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["audience"], message: "School notices cannot target a class or section" }); if (value.audience === "class" && (!value.classId || value.sectionId)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["classId"], message: "Class notices require a class and no section" }); if (value.audience === "section" && (!value.classId || !value.sectionId)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sectionId"], message: "Section notices require a class and section" }); };
export const CreateNoticeSchema = NoticeFieldsSchema.superRefine(validateNoticeDatesAndTarget);
export const UpdateNoticeSchema = NoticeFieldsSchema.partial().superRefine(validateNoticeDatesAndTarget);
export const NoticeQuerySchema = PaginationSchema.extend({ priority: NoticePrioritySchema.optional(), includeUnpublished: z.coerce.boolean().default(false) });

export const TimetableDaySchema = z.number().int().min(1).max(7);
export const TimetableTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:mm format");
const TimetableFieldsSchema = z.object({ academicYearId: ObjectIdSchema, classId: ObjectIdSchema, sectionId: ObjectIdSchema.optional(), subjectId: ObjectIdSchema, teacherId: ObjectIdSchema, dayOfWeek: TimetableDaySchema, startTime: TimetableTimeSchema, endTime: TimetableTimeSchema, roomNumber: z.string().trim().max(50).optional(), periodLabel: z.string().trim().max(50).optional() });
const validateTimetableTime = (value: any, ctx: z.RefinementCtx) => { if (value.startTime >= value.endTime) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endTime"], message: "End time must be after start time" }); };
export const CreateTimetableSchema = TimetableFieldsSchema.superRefine(validateTimetableTime);
export const UpdateTimetableSchema = TimetableFieldsSchema.partial();
export const TimetableQuerySchema = PaginationSchema.extend({ academicYearId: ObjectIdSchema.optional(), classId: ObjectIdSchema.optional(), sectionId: ObjectIdSchema.optional(), teacherId: ObjectIdSchema.optional(), dayOfWeek: z.coerce.number().int().min(1).max(7).optional() });

export type HomeworkAttachment = z.infer<typeof HomeworkAttachmentSchema>;
export type CreateHomework = z.infer<typeof CreateHomeworkSchema>;
export type UpdateHomework = z.infer<typeof UpdateHomeworkSchema>;
export type HomeworkQuery = z.infer<typeof HomeworkQuerySchema>;
export type CreateNotice = z.infer<typeof CreateNoticeSchema>;
export type UpdateNotice = z.infer<typeof UpdateNoticeSchema>;
export type NoticeQuery = z.infer<typeof NoticeQuerySchema>;
export type CreateTimetable = z.infer<typeof CreateTimetableSchema>;
export type UpdateTimetable = z.infer<typeof UpdateTimetableSchema>;
export type TimetableQuery = z.infer<typeof TimetableQuerySchema>;
