import { z } from "zod";
import { ObjectIdSchema } from "@school-erp/shared";

export const SubmitUpiPaymentSchema = z.object({
  utr: z.string().trim().min(6).max(35).regex(/^[A-Za-z0-9-]+$/),
  payerUpiId: z.string().trim().max(255).optional(),
});

export const VerifyUpiPaymentSchema = z.object({
  approved: z.boolean(),
  reason: z.string().trim().min(3).max(500).optional(),
}).superRefine((value, ctx) => {
  if (!value.approved && !value.reason) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["reason"], message: "A rejection reason is required" });
});

export const UpIOrderParamSchema = z.object({ id: ObjectIdSchema });

export const BankTransactionSchema = z.object({
  utr: z.string().trim().min(6).max(35).regex(/^[A-Za-z0-9-]+$/),
  amount: z.number().positive(),
  date: z.string().datetime(),
  payerUpiId: z.string().trim().max(255).optional(),
});

export const BankTransactionImportSchema = z.object({
  transactions: z.array(BankTransactionSchema).min(1).max(5000),
});
