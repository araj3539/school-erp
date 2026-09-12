import { z } from "zod";
import { ObjectIdSchema } from "@school-erp/shared";

export const StudentPromotionSchema = z.object({
  sourceClassId: ObjectIdSchema,
  targetClassId: ObjectIdSchema,
  targetSectionId: ObjectIdSchema.optional(),
  studentIds: z.array(ObjectIdSchema).min(1).max(1000).optional(),
  reason: z.string().trim().min(3).max(500).default("Academic promotion")
});
export const StudentPromotionExecuteSchema = StudentPromotionSchema.extend({ confirm: z.literal(true) });
