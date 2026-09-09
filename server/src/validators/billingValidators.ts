import { z } from "zod";
import { ObjectIdSchema } from "@school-erp/shared";

const CatalogCodeSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9._-]{1,63}$/, "Invalid catalog code");
const CurrencySchema = z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Currency must be a 3-letter ISO code");

export const CreateProductVersionSchema = z.object({
  code: CatalogCodeSchema,
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  version: z.number().int().positive(),
  effectiveAt: z.coerce.date(),
});

export const CreatePlanVersionSchema = z.object({
  productId: ObjectIdSchema,
  code: CatalogCodeSchema,
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  version: z.number().int().positive(),
  currency: CurrencySchema,
  amountMinor: z.number().int().nonnegative().max(2147483647),
  billingInterval: z.enum(["month", "year"]),
  trialDays: z.number().int().nonnegative().max(3650).default(0),
  includedModules: z.array(CatalogCodeSchema).max(100).default([]),
  effectiveAt: z.coerce.date(),
});

export const CreateSubscriptionSchema = z.object({
  schoolId: ObjectIdSchema,
  planId: ObjectIdSchema,
  startedAt: z.coerce.date().optional(),
});

export const TransitionSubscriptionSchema = z.object({
  event: z.enum(["activate", "mark_past_due", "suspend", "cancel", "expire", "recover"]),
});

export const ChangeSubscriptionPlanSchema = z.object({
  planId: ObjectIdSchema,
});

export type CreateProductVersionInput = z.infer<typeof CreateProductVersionSchema>;
export type CreatePlanVersionInput = z.infer<typeof CreatePlanVersionSchema>;
