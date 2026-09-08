import { z } from "zod";

export const ProviderPaymentVerificationSchema = z.object({
  paymentId: z.string().min(1).max(100),
  signature: z.string().min(16).max(200)
});

export const ProviderRefundSchema = z.object({
  amount: z.number().positive().finite(),
  reason: z.string().trim().min(3).max(500).optional()
});
