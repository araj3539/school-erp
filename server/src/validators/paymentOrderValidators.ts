import { z } from "zod";
import { ObjectIdSchema } from "@school-erp/shared";

export const CreatePaymentOrderSchema = z.object({
  feeId: ObjectIdSchema,
  amount: z.number().positive(),
  currency: z.literal("INR").default("INR"),
  idempotencyKey: z.string().trim().min(8).max(100)
});

export type CreatePaymentOrderInput = z.infer<typeof CreatePaymentOrderSchema>;
