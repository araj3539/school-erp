import { z } from "zod";

export const ModuleIdSchema = z.object({
  moduleId: z.string().trim().min(1).max(64).regex(/^[a-zA-Z][a-zA-Z0-9]*$/),
});

export const ModuleEntitlementUpdateSchema = z.object({
  enabled: z.boolean(),
});
