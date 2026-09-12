import { Request, Response, NextFunction } from "express";
import { NotificationTemplate } from "../models/NotificationTemplate.js";
import { getTenantId } from "../utils/tenant.js";
import { AppError } from "../utils/errors.js";

export async function listNotificationTemplates(req: Request, res: Response, next: NextFunction) {
  try { res.json({ templates: await NotificationTemplate.find({ schoolId: getTenantId(req), isActive: true }).sort({ category: 1, name: 1 }).lean() }); } catch (e) { next(e); }
}
export async function upsertNotificationTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const data = req.body;
    const template = await NotificationTemplate.findOneAndUpdate(
      { schoolId, name: data.name, category: data.category },
      { $set: { ...data, schoolId, createdBy: req.user!.userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    ).lean();
    res.json({ template });
  } catch (e) { next(e); }
}
export async function archiveNotificationTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const template = await NotificationTemplate.findOneAndUpdate({ _id: req.params.id, schoolId: getTenantId(req), isActive: true }, { $set: { isActive: false } }, { new: true }).lean();
    if (!template) throw AppError.notFound("Notification template not found");
    res.json({ template });
  } catch (e) { next(e); }
}
