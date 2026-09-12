import { z } from "zod";
import { ObjectIdSchema } from "@school-erp/shared";

export const CreateFeeHeadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/),
  kind: z.enum(["one_time", "recurring", "optional"]).default("recurring"),
  category: z.enum(["tuition", "admission", "exam", "transport", "uniform", "books", "activity", "other"]).default("other"),
  description: z.string().trim().max(500).optional()
});
export const UpdateFeeHeadSchema = CreateFeeHeadSchema.partial().extend({ isActive: z.boolean().optional() });
export const FeeHeadParamSchema = z.object({ id: ObjectIdSchema });
export const CreateFeeItemSchema = z.object({
  studentId: ObjectIdSchema,
  feeId: ObjectIdSchema,
  feeHeadId: ObjectIdSchema,
  label: z.string().trim().min(1).max(100),
  amount: z.number().min(0),
  dueDate: z.string().datetime().optional()
});
export const FeeItemAdjustmentSchema = z.object({
  type: z.enum(["discount", "waiver", "surcharge", "amount_override"]),
  amount: z.number().min(0).optional(),
  percent: z.number().min(0).max(100).optional(),
  reason: z.string().trim().min(3).max(500)
}).superRefine((value, ctx) => {
  if (value.amount === undefined && value.percent === undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["amount"], message: "Provide an amount or percentage" });
  if (value.amount !== undefined && value.percent !== undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["percent"], message: "Use either amount or percentage" });
});
export const FeeItemParamSchema = z.object({ id: ObjectIdSchema });
