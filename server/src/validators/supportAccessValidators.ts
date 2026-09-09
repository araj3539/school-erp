import { z } from "zod";
import { ObjectIdSchema } from "@school-erp/shared";

export const SupportTenantParamSchema = z.object({ schoolId: ObjectIdSchema });
export const SupportDiagnosticSchema = z.object({
  reason: z.string().trim().min(10).max(500),
});
export const SupportAuditQuerySchema = z.object({
  page: z.coerce.number().int().positive().max(100000).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
