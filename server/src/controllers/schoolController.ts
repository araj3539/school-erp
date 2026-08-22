import { Request, Response, NextFunction } from "express";
import { School } from "../models/index.js";
import { UpdateSchoolSettingsSchema } from "../validators/index.js";
import { createAuditLog } from "../services/auditLog.js";
import { AppError } from "../utils/errors.js";

const tenantId = (req: Request) => req.user!.schoolId;

export async function getSchoolSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = tenantId(req);
    if (!schoolId) throw AppError.forbidden("School context is required");
    const school = await School.findById(schoolId).select("code name logo address phone email session academicYear settings").lean();
    if (!school) throw AppError.notFound("School not found");
    res.json({ school });
  } catch (error) {
    next(error);
  }
}

export async function updateSchoolSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = tenantId(req);
    if (!schoolId) throw AppError.forbidden("School context is required");

    const data = UpdateSchoolSettingsSchema.parse(req.body);
    const before = await School.findById(schoolId).select("name logo address phone email session settings").lean();
    if (!before) throw AppError.notFound("School not found");

    const school = await School.findByIdAndUpdate(
      schoolId,
      { $set: data },
      { new: true, runValidators: true }
    ).select("code name logo address phone email session academicYear settings").lean();

    if (!school) throw AppError.notFound("School not found");

    await createAuditLog({
      schoolId: schoolId.toString(),
      userId: req.user!.userId,
      action: "UPDATE",
      entity: "School",
      entityId: schoolId.toString(),
      before,
      after: { name: school.name, logo: school.logo, address: school.address, phone: school.phone, email: school.email, session: school.session, settings: school.settings },
    });

    res.json({ school });
  } catch (error) {
    next(error);
  }
}
