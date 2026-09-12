import { Request, Response, NextFunction } from "express";
import { NotificationTemplate } from "../models/NotificationTemplate.js";
import { createAuditLog } from "../services/auditLog.js";
import { getTenantId } from "../utils/tenant.js";
import { AppError } from "../utils/errors.js";

export async function listNotificationTemplates(req: Request, res: Response, next: NextFunction) {
  try { res.json({ templates: await NotificationTemplate.find({ schoolId: getTenantId(req), isActive: true }).sort({ category: 1, name: 1 }).lean() }); } catch (e) { next(e); }
}

export async function upsertNotificationTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const data = req.body;
    const existing = await NotificationTemplate.findOne({ schoolId, name: data.name, category: data.category }).lean();
    const template = await NotificationTemplate.findOneAndUpdate(
      { schoolId, name: data.name, category: data.category },
      { $set: { ...data, schoolId, createdBy: req.user!.userId, isActive: true } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    ).lean();
    await createAuditLog({ schoolId: String(schoolId), userId: req.user!.userId, action: existing ? "UPDATE" : "CREATE", entity: "NotificationTemplate", entityId: String(template!._id), before: existing ?? undefined, after: template as unknown as Record<string, unknown> });
    res.json({ template });
  } catch (e) { next(e); }
}

export async function archiveNotificationTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const existing = await NotificationTemplate.findOne({ _id: req.params.id, schoolId, isActive: true }).lean();
    if (!existing) throw AppError.notFound("Notification template not found");
    const template = await NotificationTemplate.findOneAndUpdate({ _id: req.params.id, schoolId, isActive: true }, { $set: { isActive: false } }, { new: true }).lean();
    await createAuditLog({ schoolId: String(schoolId), userId: req.user!.userId, action: "ARCHIVE", entity: "NotificationTemplate", entityId: req.params.id, before: existing, after: template as unknown as Record<string, unknown> });
    res.json({ template });
  } catch (e) { next(e); }
}
