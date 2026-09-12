import { z } from "zod";
import { FeeType, ObjectIdSchema } from "@school-erp/shared";

const InstallmentSchema = z.object({
  name: z.string().trim().min(1).max(80),
  amount: z.number().min(0),
  dueDate: z.string().datetime()
});

const ConcessionRuleSchema = z.object({
  name: z.string().trim().min(1).max(100),
  code: z.string().trim().min(1).max(40),
  valueType: z.enum(["fixed", "percent"]),
  value: z.number().min(0),
  active: z.boolean().default(true)
});

const LateFeePolicySchema = z.object({
  enabled: z.boolean().default(false),
  graceDays: z.number().int().min(0).default(0),
  valueType: z.enum(["fixed", "percent"]).default("fixed"),
  value: z.number().min(0).default(0),
  maxAmount: z.number().min(0).optional()
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
  concessionRules: z.array(ConcessionRuleSchema).default([]),
  lateFeePolicy: LateFeePolicySchema.default({ enabled: false, graceDays: 0, valueType: "fixed", value: 0 }),
  installments: z.array(InstallmentSchema).default([])
});

const validateFeeStructure = (value: z.infer<typeof FlexibleFeeStructureBaseSchema>, ctx: z.RefinementCtx) => {
  if (value.concessionAmount > value.amount) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["concessionAmount"], message: "Concession amount cannot exceed fee amount" });
  if (value.concessionPercent > 0 && value.concessionAmount > 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["concessionAmount"], message: "Use either concession percent or concession amount" });
  const total = value.installments.reduce((sum, item) => sum + item.amount, 0);
  if (total > 0 && Math.abs(total - value.amount) > 0.01) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["installments"], message: "Installments must total the fee amount" });
  value.concessionRules.forEach((rule, index) => {
    if (rule.valueType === "percent" && rule.value > 100) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["concessionRules", index, "value"], message: "Percentage cannot exceed 100" });
    if (rule.valueType === "fixed" && rule.value > value.amount) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["concessionRules", index, "value"], message: "Fixed concession cannot exceed fee amount" });
  });
  if (value.lateFeePolicy.valueType === "percent" && value.lateFeePolicy.value > 100) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lateFeePolicy", "value"], message: "Late fee percentage cannot exceed 100" });
};

export const CreateFlexibleFeeStructureSchema = FlexibleFeeStructureBaseSchema.superRefine(validateFeeStructure);
export const UpdateFlexibleFeeStructureSchema = FlexibleFeeStructureBaseSchema.partial().superRefine((value, ctx) => {
  if (value.concessionAmount !== undefined && value.amount !== undefined && value.concessionAmount > value.amount) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["concessionAmount"], message: "Concession amount cannot exceed fee amount" });
  if ((value.concessionPercent ?? 0) > 0 && (value.concessionAmount ?? 0) > 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["concessionAmount"], message: "Use either concession percent or concession amount" });
  if (value.installments && value.amount !== undefined) {
    const total = value.installments.reduce((sum, item) => sum + item.amount, 0);
    if (total > 0 && Math.abs(total - value.amount) > 0.01) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["installments"], message: "Installments must total the fee amount" });
  }
});
