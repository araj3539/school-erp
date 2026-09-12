import { z } from "zod";
import { ObjectIdSchema } from "@school-erp/shared";

export const AcademicYearTransitionPreviewSchema = z.object({
  fromAcademicYearId: ObjectIdSchema,
  toAcademicYearId: ObjectIdSchema
});

export const AcademicYearTransitionExecuteSchema = AcademicYearTransitionPreviewSchema.extend({
  confirm: z.literal(true),
  studentPolicy: z.enum(["promote", "keep"]).default("promote"),
  reason: z.string().trim().min(3).max(500).default("Academic-year transition")
});
