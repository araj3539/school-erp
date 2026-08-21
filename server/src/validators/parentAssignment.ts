import { z } from "zod";
import { ObjectIdSchema } from "@school-erp/shared";

export const ParentAssignmentSchema = z.object({
  parentIds: z.array(ObjectIdSchema).max(5)
}).superRefine((value, ctx) => {
  if (new Set(value.parentIds).size !== value.parentIds.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["parentIds"], message: "Duplicate parent assignments are not allowed" });
  }
});
