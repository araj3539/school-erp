import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { Notification, NotificationDeliveryAttempt, NotificationPreference, User, Student } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";
import { createAuditLog } from "../services/auditLog.js";
import { enqueueNotificationEvent } from "../services/notificationService.js";

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
    const notification = await Notification.findOneAndUpdate(tenantFilter(req, { _id: id, recipientId: req.user!.userId }), { $set: { readAt: new Date() } }, { new: true }).lean();
    if (!notification) throw AppError.notFound("Notification not found");
    res.json({ notification });
  } catch (e) { next(e); }
}

export async function markAllNotificationsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await Notification.updateMany(tenantFilter(req, { recipientId: req.user!.userId, readAt: { $exists: false } }), { $set: { readAt: new Date() } });
    res.json({ updated: result.modifiedCount });
  } catch (e) { next(e); }
}

export async function getNotificationPreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const preferences = await NotificationPreference.find(tenantFilter(req, { userId: req.user!.userId })).sort({ category: 1 }).lean();
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
    const preference = await NotificationPreference.findOneAndUpdate(tenantFilter(req, { userId: req.user!.userId, category: data.category }), { $set: { channels, quietHours: data.quietHours } }, { new: true, upsert: true, setDefaultsOnInsert: true }).lean();
    res.json({ preference });
  } catch (e) { next(e); }
}

export async function getNotificationDeliveryAttempts(req: Request, res: Response, next: NextFunction) {
  try {
    const rawPage = Number(req.query.page ?? 1); const rawLimit = Number(req.query.limit ?? 50);
    const page = Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 100000) : 1; const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 50;
    const filter: Record<string, unknown> = tenantFilter(req);
    if (typeof req.query.status === "string" && ["processing", "succeeded", "retrying", "dead_letter"].includes(req.query.status)) filter.status = req.query.status;
    if (typeof req.query.eventId === "string" && req.query.eventId.length <= 100) filter.eventId = req.query.eventId;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([NotificationDeliveryAttempt.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), NotificationDeliveryAttempt.countDocuments(filter)]);
    res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e) { next(e); }
}

export async function sendFeeReminders(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.validatedBody as { studentIds: string[]; kind: "due" | "overdue"; message?: string };
    const schoolId = getTenantId(req);
    const students = await Student.find({ _id: { $in: data.studentIds }, schoolId }).select("_id firstName lastName userId parentIds").lean();
    if (students.length !== data.studentIds.length) throw AppError.badRequest("Every selected student must belong to the current school");
    const dayKey = new Date().toISOString().slice(0, 10);
    let queued = 0;
    for (const student of students) {
      const recipientIds = [student.userId, ...(student.parentIds ?? [])].filter((id): id is Types.ObjectId => Boolean(id));
      const validUsers = recipientIds.length ? await User.find({ _id: { $in: recipientIds }, schoolId, isActive: true }).select("_id").lean() : [];
      const ids = validUsers.map((user) => user._id);
      if (!ids.length) continue;
      const name = `${student.firstName} ${student.lastName}`.trim();
      const title = data.kind === "overdue" ? `Fee overdue reminder: ${name}` : `Fee due reminder: ${name}`;
      const message = data.message || (data.kind === "overdue" ? `Please review ${name}'s outstanding school fee balance and arrange payment.` : `A school fee payment is due for ${name}. Please review the fee statement.`);
      const event = await enqueueNotificationEvent({ schoolId: new Types.ObjectId(schoolId), eventType: `fee.${data.kind}_reminder`, category: "fee", priority: data.kind === "overdue" ? "high" : "normal", recipientIds: ids, title, message, idempotencyKey: `fee-reminder:${data.kind}:${student._id.toString()}:${dayKey}`, payload: { studentId: student._id.toString(), kind: data.kind, sentBy: req.user!.userId } });
      if (event) queued += 1;
      await createAuditLog({ userId: req.user!.userId, schoolId, action: "SEND_FEE_REMINDER", entity: "Student", entityId: student._id.toString(), after: { kind: data.kind, recipientCount: ids.length, queued: Boolean(event) } });
    }
    res.status(202).json({ requested: students.length, queued, skippedWithoutRecipients: students.length - queued });
  } catch (e) { next(e); }
}
