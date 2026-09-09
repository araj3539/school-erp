import { z } from "zod";
import { ObjectIdSchema } from "@school-erp/shared";

const OptionalDateSchema = z.string().datetime({ offset: true }).optional();

export const PlatformAuditQuerySchema = z.object({
  schoolId: ObjectIdSchema.optional(),
  userId: ObjectIdSchema.optional(),
  action: z.string().trim().min(1).max(100).optional(),
  entity: z.string().trim().min(1).max(100).optional(),
  startDate: OptionalDateSchema,
  endDate: OptionalDateSchema,
  page: z.coerce.number().int().min(1).max(100000).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
}).superRefine((value, ctx) => {
  if (value.startDate && value.endDate && new Date(value.startDate) > new Date(value.endDate)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "endDate must be after startDate" });
  }
});
