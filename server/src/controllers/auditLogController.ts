import { Request, Response, NextFunction } from "express";
import { getAuditLogs } from "../services/auditLog.js";
import { AppError } from "../utils/errors.js";

export async function listAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user?.schoolId;
    if (!schoolId) throw AppError.forbidden("Audit logs require a school context");

    const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? "20"), 10) || 20));
    const userId = typeof req.query.userId === "string" && req.query.userId ? req.query.userId : undefined;
    const entity = typeof req.query.entity === "string" && req.query.entity ? req.query.entity : undefined;
    const entityId = typeof req.query.entityId === "string" && req.query.entityId ? req.query.entityId : undefined;
    const startDate = typeof req.query.startDate === "string" && req.query.startDate ? new Date(req.query.startDate) : undefined;
    const endDate = typeof req.query.endDate === "string" && req.query.endDate ? new Date(req.query.endDate) : undefined;

    if (startDate && Number.isNaN(startDate.getTime())) throw AppError.badRequest("Invalid startDate");
    if (endDate && Number.isNaN(endDate.getTime())) throw AppError.badRequest("Invalid endDate");
    if (startDate && endDate && startDate > endDate) throw AppError.badRequest("startDate must be before endDate");

    const result = await getAuditLogs({ schoolId, userId, entity, entityId, startDate, endDate, page, limit });
    res.json({ ...result, page, limit });
  } catch (error) {
    next(error);
  }
}
