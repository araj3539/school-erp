import { z } from "zod";
import { ObjectIdSchema } from "@school-erp/shared";

export const TenantUsageParamSchema = z.object({ schoolId: ObjectIdSchema });
export const TenantLimitParamSchema = z.object({
  schoolId: ObjectIdSchema,
  dimension: z.enum(["students", "school_users", "storage_bytes"]),
});
export const TenantLimitSchema = z.object({
  limit: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
});
