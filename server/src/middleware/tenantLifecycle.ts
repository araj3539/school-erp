import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { School } from "../models/index.js";
import { UserRole } from "@school-erp/shared";
import { AppError } from "../utils/errors.js";

/** Blocks school-scoped authority when a tenant is suspended or archived. */
export async function requireActiveTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const schoolId = req.user.schoolId || (
      req.user.role === UserRole.SUPER_ADMIN ? req.get("X-School-Id")?.trim() : undefined
    );
    if (!schoolId || !mongoose.isValidObjectId(schoolId)) {
      throw AppError.forbidden("Active school context is required");
    }

    const school = await School.findById(schoolId).select("tenantStatus").lean();
    if (!school) throw AppError.notFound("School not found");

    // Existing tenants created before the lifecycle field was introduced are active by default.
    if ((school.tenantStatus ?? "active") !== "active") {
      throw AppError.forbidden("School access is unavailable while this tenant is not active");
    }

    next();
  } catch (error) {
    next(error);
  }
}
