import { Request, Response, NextFunction } from "express";
import { Notification, NotificationPreference, User } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";

const tenantFilter = (req: Request, extra: Record<string, unknown> = {}) => ({ schoolId: getTenantId(req), ...extra });

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.validatedQuery as { page: number; limit: number; unreadOnly: boolean; category?: string };
    const filter: Record<string, unknown> = tenantFilter(req, { recipientId: req.user!.userId });
    if (q.unreadOnly) filter.readAt = { $exists: false };
    if (q.category) filter.category = q.category;
    const skip = (q.page - 1) * q.limit;
    const [data, total, unread] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(q.limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments(tenantFilter(req, { recipientId: req.user!.userId, readAt: { $exists: false } })),
    ]);
    res.json({ data, unread, pagination: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) } });
  } catch (e) { next(e); }
}

export async function markNotificationRead(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const notification = await Notification.findOneAndUpdate(
      tenantFilter(req, { _id: id, recipientId: req.user!.userId }),
      { $set: { readAt: new Date() } },
      { new: true },
    ).lean();
    if (!notification) throw AppError.notFound("Notification not found");
    res.json({ notification });
  } catch (e) { next(e); }
}

export async function markAllNotificationsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await Notification.updateMany(
      tenantFilter(req, { recipientId: req.user!.userId, readAt: { $exists: false } }),
      { $set: { readAt: new Date() } },
    );
    res.json({ updated: result.modifiedCount });
  } catch (e) { next(e); }
}

export async function getNotificationPreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const preferences = await NotificationPreference.find(
      tenantFilter(req, { userId: req.user!.userId }),
    ).sort({ category: 1 }).lean();
    res.json({ preferences });
  } catch (e) { next(e); }
}

export async function upsertNotificationPreference(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.validatedBody as { category: string; channels: string[]; quietHours?: { start: string; end: string } };
    const user = await User.findOne(tenantFilter(req, { _id: req.user!.userId })).select("_id").lean();
    if (!user) throw AppError.notFound("User not found");
    const mandatory = data.category === "system";
    const channels = mandatory && !data.channels.includes("in_app") ? [...data.channels, "in_app"] : data.channels;
    const preference = await NotificationPreference.findOneAndUpdate(
      tenantFilter(req, { userId: req.user!.userId, category: data.category }),
      { $set: { channels, quietHours: data.quietHours } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();
    res.json({ preference });
  } catch (e) { next(e); }
}
