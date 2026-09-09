import { z } from "zod";
import { ObjectIdSchema } from "@school-erp/shared";

export const TenantStatusSchema = z.enum(["active", "suspended", "archived"]);
export const PlatformTenantQuerySchema = z.object({
  status: TenantStatusSchema.optional()
});
export const UpdateTenantLifecycleSchema = z.object({
  status: TenantStatusSchema,
  reason: z.string().trim().min(3).max(500)
});
export const PlatformTenantIdSchema = z.object({ id: ObjectIdSchema });
