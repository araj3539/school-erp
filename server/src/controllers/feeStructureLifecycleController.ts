import { Request, Response, NextFunction } from "express";
import { archiveFeeStructure, activateFeeStructure } from "../services/feeStructureService.js";
import { FeeStructure } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { createAuditLog } from "../services/auditLog.js";

const tenantId = (req: Request) => req.user!.schoolId;

export async function setFeeStructureLifecycle(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = tenantId(req);
    if (!schoolId) throw AppError.forbidden("A school context is required");
    const { id } = req.validatedParams as { id: string };
    const target = req.body.status as "active" | "archived";
    const before = await FeeStructure.findOne({ _id: id, schoolId }).lean();
    if (!before) throw AppError.notFound("Fee structure not found");
    const structure = target === "archived"
      ? await archiveFeeStructure(id, schoolId)
      : await activateFeeStructure(id, schoolId);
    if (!structure) throw AppError.conflict(target === "active" ? "Archived fee structures cannot be reactivated" : "Fee structure is already archived");
    await createAuditLog({ userId: req.user!.userId, action: "FEE_STRUCTURE_LIFECYCLE", entity: "FeeStructure", entityId: id, after: { status: structure.status, beforeStatus: before.status } });
    res.json({ feeStructure: structure });
  } catch (error) { next(error); }
}
