import { z } from "zod";
import { ObjectIdSchema, UpdateStudentSchema } from "@school-erp/shared";

export const StudentLifecycleTransitionSchema = z.object({
  toStatus: z.string().min(1),
  reason: z.string().trim().min(3).max(1000),
  effectiveAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const StudentLifecycleQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  fromStatus: z.string().optional(),
  toStatus: z.string().optional()
});

export const StudentLifecycleParamSchema = z.object({ id: ObjectIdSchema });
export const UpdateStudentLifecycleSafeSchema = UpdateStudentSchema.omit({ status: true }).strict();
