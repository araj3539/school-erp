import { z } from "zod";
import { FeeType, ObjectIdSchema } from "@school-erp/shared";

const InstallmentSchema = z.object({
  name: z.string().trim().min(1).max(80),
  amount: z.number().min(0),
  dueDate: z.string().datetime()
});

const FlexibleFeeStructureBaseSchema = z.object({
  classId: ObjectIdSchema,
  feeType: z.nativeEnum(FeeType),
  amount: z.number().min(0),
  dueDate: z.string().datetime().optional(),
  academicYear: ObjectIdSchema,
  status: z.enum(["draft", "active", "archived"]).optional(),
  concessionPercent: z.number().min(0).max(100).default(0),
  concessionAmount: z.number().min(0).default(0),
  installments: z.array(InstallmentSchema).default([])
});

const validateFeeStructure = (value: z.infer<typeof FlexibleFeeStructureBaseSchema>, ctx: z.RefinementCtx) => {
  if (value.concessionAmount > value.amount) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["concessionAmount"], message: "Concession amount cannot exceed fee amount" });
  if (value.concessionPercent > 0 && value.concessionAmount > 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["concessionAmount"], message: "Use either concession percent or concession amount" });
  const total = value.installments.reduce((sum, item) => sum + item.amount, 0);
  if (total > 0 && Math.abs(total - value.amount) > 0.01) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["installments"], message: "Installments must total the fee amount" });
};

export const CreateFlexibleFeeStructureSchema = FlexibleFeeStructureBaseSchema.superRefine(validateFeeStructure);
export const UpdateFlexibleFeeStructureSchema = FlexibleFeeStructureBaseSchema.partial();
