import { Request } from "express";
import { AppError } from "./errors.js";

/**
 * Returns the authenticated tenant (school) id.
 * All tenant-owned data access should derive schoolId from the verified JWT,
 * never from client-supplied request data.
 */
export function getTenantId(req: Request): string {
  const schoolId = req.user?.schoolId;
  if (!schoolId) {
    throw AppError.unauthorized("School context is required");
  }
  return schoolId;
}

/**
 * Prevents callers from changing tenant ownership through request bodies.
 */
export function withTenant<T extends Record<string, any>>(req: Request, data: T): T & { schoolId: string } {
  const { schoolId: _ignored, ...safeData } = data;
  return { ...safeData, schoolId: getTenantId(req) } as T & { schoolId: string };
}
