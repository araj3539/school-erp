import { z } from "zod";
import { ObjectIdSchema } from "@school-erp/shared";

export const CreateStudentSiblingSchema = z.object({
  siblingId: ObjectIdSchema,
  relationship: z.enum(["sibling", "half_sibling"]).default("sibling")
});

export const StudentSiblingParamSchema = z.object({
  id: ObjectIdSchema,
  siblingId: ObjectIdSchema
});
