import { Request } from "express";
import mongoose from "mongoose";
import { UserRole } from "@school-erp/shared";
import { AppError } from "./errors.js";

/**
 * Returns the effective tenant (school) id for the request.
 *
 * School users always use the schoolId embedded in their verified JWT.
 * SUPER_ADMIN never belongs to a school, so a platform request must explicitly
 * choose a tenant through X-School-Id. This header is ignored for school users.
 */
export function getTenantId(req: Request): string {
  const schoolId = req.user?.schoolId;
  if (schoolId) return schoolId;

  if (req.user?.role === UserRole.SUPER_ADMIN) {
    const selectedSchoolId = req.get("X-School-Id")?.trim();
    if (!selectedSchoolId) throw AppError.badRequest("Select a school before accessing school data");
    if (!mongoose.isValidObjectId(selectedSchoolId)) throw AppError.badRequest("Invalid selected school");
    return selectedSchoolId;
  }

  throw AppError.unauthorized("School context is required");
}

/**
 * Prevents callers from changing tenant ownership through request bodies.
 */
export function withTenant<T extends Record<string, any>>(req: Request, data: T): T & { schoolId: string } {
  const { schoolId: _ignored, ...safeData } = data;
  return { ...safeData, schoolId: getTenantId(req) } as T & { schoolId: string };
}
