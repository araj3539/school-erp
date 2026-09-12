import { z } from "zod";
import { ObjectIdSchema, DateOnlySchema } from "@school-erp/shared";

export const FeeDefaulterQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  classId: ObjectIdSchema.optional(),
  sectionId: ObjectIdSchema.optional(),
  feeHeadId: ObjectIdSchema.optional(),
  academicYear: ObjectIdSchema.optional(),
  agingBucket: z.enum(["1-30", "31-60", "61-90", "91+"]).optional(),
  asOf: DateOnlySchema.optional(),
});

export const FeeLedgerReportQuerySchema = z.object({
  classId: ObjectIdSchema.optional(),
  sectionId: ObjectIdSchema.optional(),
  feeHeadId: ObjectIdSchema.optional(),
  academicYear: ObjectIdSchema.optional(),
  startDate: DateOnlySchema.optional(),
  endDate: DateOnlySchema.optional(),
});

export const ReconciliationExceptionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  startDate: DateOnlySchema.optional(),
  endDate: DateOnlySchema.optional(),
});

export const FeeReminderSchema = z.object({
  studentIds: z.array(ObjectIdSchema).min(1).max(200),
  kind: z.enum(["due", "overdue"]).default("overdue"),
  message: z.string().trim().max(500).optional(),
});
