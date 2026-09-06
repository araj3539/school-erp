import { Types } from "mongoose";
import { Notification, NotificationEvent, NotificationPreference, User, Student, Teacher } from "../models/index.js";
import type { NotificationCategory, NotificationPriority } from "../models/Notification.js";
import type { NotificationChannel } from "../models/NotificationPreference.js";

const MAX_ATTEMPTS = 5;
const LOCK_TIMEOUT_MS = 10 * 60 * 1000;

export interface EnqueueNotificationEventInput {
  schoolId: Types.ObjectId;
  eventType: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  recipientIds: Types.ObjectId[];
  title: string;
  message: string;
  idempotencyKey: string;
  payload?: Record<string, unknown>;
  nextAttemptAt?: Date;
}

export async function enqueueNotificationEvent(input: EnqueueNotificationEventInput) {
  if (!input.recipientIds.length) return null;
  return NotificationEvent.findOneAndUpdate(
    { schoolId: input.schoolId, idempotencyKey: input.idempotencyKey },
    { $setOnInsert: { ...input, priority: input.priority ?? "normal", status: "pending", attempts: 0, nextAttemptAt: input.nextAttemptAt ?? new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
}

interface NoticeNotificationInput { _id: Types.ObjectId; schoolId: Types.ObjectId; audience: "school" | "class" | "section"; classId?: Types.ObjectId; sectionId?: Types.ObjectId; title: string; message: string; priority: NotificationPriority; publishAt: Date; expiresAt?: Date; }

export async function resolveNoticeRecipients(notice: Pick<NoticeNotificationInput, "schoolId" | "audience" | "classId" | "sectionId">) {
  const schoolId = notice.schoolId;
  const studentFilter: Record<string, unknown> = { schoolId, status: "active" };
  if (notice.audience === "class") studentFilter.classId = notice.classId;
  if (notice.audience === "section") { studentFilter.classId = notice.classId; studentFilter.sectionId = notice.sectionId; }
  const students = await Student.find(studentFilter).select("userId parentIds").lean();
  const recipientIds = new Set<string>();
  for (const student of students) { if (student.userId) recipientIds.add(student.userId.toString()); for (const parentId of student.parentIds ?? []) recipientIds.add(parentId.toString()); }
  const teachers = await Teacher.find({ schoolId }).select("userId classTeacherOf").lean();
  for (const teacher of teachers) {
    if (!teacher.userId) continue;
    if (notice.audience === "school" || (!!notice.classId && (teacher.classTeacherOf ?? []).some((classId) => classId.equals(notice.classId)))) recipientIds.add(teacher.userId.toString());
  }
  const ids = [...recipientIds].map((id) => new Types.ObjectId(id));
  if (!ids.length) return [];
  const users = await User.find({ _id: { $in: ids }, schoolId, isActive: true }).select("_id").lean();
  return users.map((user) => user._id);
}

export async function enqueueNoticeNotification(notice: NoticeNotificationInput) {
  const recipientIds = await resolveNoticeRecipients(notice);
  if (!recipientIds.length) return null;
  return enqueueNotificationEvent({ schoolId: notice.schoolId, eventType: "notice.published", category: "announcement", priority: notice.priority, recipientIds, title: notice.title, message: notice.message, idempotencyKey: `notice:${notice._id.toString()}:${notice.publishAt.toISOString()}`, payload: { noticeId: notice._id.toString(), audience: notice.audience, classId: notice.classId?.toString(), sectionId: notice.sectionId?.toString(), expiresAt: notice.expiresAt?.toISOString() }, nextAttemptAt: notice.publishAt });
}

interface AttendanceNotificationInput { _id: Types.ObjectId; schoolId: Types.ObjectId; date: Date; records: Array<{ studentId: Types.ObjectId; status: string; remark?: string }>; }
const attendanceAlertStatuses = new Set(["absent", "late", "half_day"]);
export async function enqueueAttendanceNotifications(attendance: AttendanceNotificationInput) {
  const alertRecords = attendance.records.filter((record) => attendanceAlertStatuses.has(record.status));
  if (!alertRecords.length) return [];
  const studentIds = [...new Set(alertRecords.map((record) => record.studentId.toString()))].map((id) => new Types.ObjectId(id));
  const students = await Student.find({ _id: { $in: studentIds }, schoolId: attendance.schoolId }).select("firstName lastName userId parentIds").lean();
  const studentById = new Map(students.map((student) => [student._id.toString(), student]));
  const recipientIds = new Set<string>();
  for (const student of students) { if (student.userId) recipientIds.add(student.userId.toString()); for (const parentId of student.parentIds ?? []) recipientIds.add(parentId.toString()); }
  const recipientObjectIds = [...recipientIds].map((id) => new Types.ObjectId(id));
  const users = await User.find({ _id: { $in: recipientObjectIds }, schoolId: attendance.schoolId, isActive: true }).select("_id").lean();
  const validUserIds = new Set(users.map((user) => user._id.toString()));
  const events = [];
  for (const record of alertRecords) {
    const student = studentById.get(record.studentId.toString()); if (!student) continue;
    const eligibleRecipients = [student.userId, ...(student.parentIds ?? [])].filter((id): id is Types.ObjectId => Boolean(id) && validUserIds.has(id.toString()));
    if (!eligibleRecipients.length) continue;
    const name = `${student.firstName} ${student.lastName}`.trim();
    const statusLabel = record.status === "half_day" ? "half-day" : record.status;
    events.push(await enqueueNotificationEvent({ schoolId: attendance.schoolId, eventType: "attendance.alert", category: "attendance", priority: record.status === "absent" ? "high" : "normal", recipientIds: [...new Map(eligibleRecipients.map((id) => [id.toString(), id])).values()], title: `Attendance alert: ${name}`, message: `${name} was marked ${statusLabel} on ${attendance.date.toISOString().slice(0, 10)}.`, idempotencyKey: `attendance:${attendance._id.toString()}:${record.studentId.toString()}:${record.status}`, payload: { attendanceId: attendance._id.toString(), studentId: record.studentId.toString(), status: record.status, remark: record.remark, date: attendance.date.toISOString() } }));
  }
  return events.filter(Boolean);
}

interface HomeworkNotificationInput { _id: Types.ObjectId; schoolId: Types.ObjectId; classId: Types.ObjectId; sectionId?: Types.ObjectId; title: string; description?: string; subjectId: Types.ObjectId; assignedDate: Date; dueDate: Date; }
export async function enqueueHomeworkNotification(homework: HomeworkNotificationInput) {
  const studentFilter: Record<string, unknown> = { schoolId: homework.schoolId, classId: homework.classId, status: "active" };
  if (homework.sectionId) studentFilter.sectionId = homework.sectionId;
  const students = await Student.find(studentFilter).select("userId parentIds").lean();
  const recipientSet = new Set<string>();
  for (const student of students) { if (student.userId) recipientSet.add(student.userId.toString()); for (const parentId of student.parentIds ?? []) recipientSet.add(parentId.toString()); }
  const ids = [...recipientSet].map((id) => new Types.ObjectId(id));
  const users = ids.length ? await User.find({ _id: { $in: ids }, schoolId: homework.schoolId, isActive: true }).select("_id").lean() : [];
  const recipientIds = users.map((user) => user._id);
  if (!recipientIds.length) return null;
  return enqueueNotificationEvent({ schoolId: homework.schoolId, eventType: "homework.published", category: "homework", recipientIds, title: `New homework: ${homework.title}`, message: `New homework has been assigned${homework.dueDate ? ` and is due on ${homework.dueDate.toISOString().slice(0, 10)}` : ""}.`, idempotencyKey: `homework:${homework._id.toString()}`, payload: { homeworkId: homework._id.toString(), classId: homework.classId.toString(), sectionId: homework.sectionId?.toString(), subjectId: homework.subjectId.toString(), assignedDate: homework.assignedDate.toISOString(), dueDate: homework.dueDate.toISOString() } });
}

interface ResultPublicationInput { _id: Types.ObjectId; schoolId: Types.ObjectId; name: string; classId: Types.ObjectId; publishedAt: Date; }
export async function enqueueResultPublicationNotification(exam: ResultPublicationInput) {
  const students = await Student.find({ schoolId: exam.schoolId, classId: exam.classId, status: "active" }).select("userId parentIds").lean();
  const recipientSet = new Set<string>();
  for (const student of students) { if (student.userId) recipientSet.add(student.userId.toString()); for (const parentId of student.parentIds ?? []) recipientSet.add(parentId.toString()); }
  const ids = [...recipientSet].map((id) => new Types.ObjectId(id));
  const users = ids.length ? await User.find({ _id: { $in: ids }, schoolId: exam.schoolId, isActive: true }).select("_id").lean() : [];
  const recipientIds = users.map((user) => user._id);
  if (!recipientIds.length) return null;
  return enqueueNotificationEvent({ schoolId: exam.schoolId, eventType: "result.published", category: "results", priority: "high", recipientIds, title: `Results published: ${exam.name}`, message: `Results for ${exam.name} are now available.`, idempotencyKey: `result:${exam._id.toString()}:${exam.publishedAt.toISOString()}`, payload: { examId: exam._id.toString(), classId: exam.classId.toString(), publishedAt: exam.publishedAt.toISOString() } });
}

interface PaymentNotificationInput { _id: Types.ObjectId; schoolId: Types.ObjectId; studentId: Types.ObjectId; amount: number; receiptNo: string; date: Date; feeId: Types.ObjectId; }
export async function enqueuePaymentNotification(payment: PaymentNotificationInput) {
  const student = await Student.findOne({ _id: payment.studentId, schoolId: payment.schoolId }).select("userId parentIds firstName lastName").lean();
  if (!student) return null;
  const ids = [student.userId, ...(student.parentIds ?? [])].filter((id): id is Types.ObjectId => Boolean(id));
  const users = ids.length ? await User.find({ _id: { $in: ids }, schoolId: payment.schoolId, isActive: true }).select("_id").lean() : [];
  const recipientIds = users.map((user) => user._id);
  if (!recipientIds.length) return null;
  const name = `${student.firstName} ${student.lastName}`.trim();
  return enqueueNotificationEvent({ schoolId: payment.schoolId, eventType: "fee.payment_received", category: "fees", priority: "high", recipientIds, title: `Fee payment received: ${name}`, message: `Payment of ${payment.amount.toFixed(2)} received. Receipt ${payment.receiptNo}.`, idempotencyKey: `payment:${payment._id.toString()}`, payload: { paymentId: payment._id.toString(), feeId: payment.feeId.toString(), studentId: payment.studentId.toString(), amount: payment.amount, receiptNo: payment.receiptNo, date: payment.date.toISOString() } });
}

function retryDelay(attempt: number) { return Math.min(60_000, 1000 * 2 ** Math.max(0, attempt - 1)); }
async function claimNextEvent() { const now = new Date(); const staleBefore = new Date(now.getTime() - LOCK_TIMEOUT_MS); return NotificationEvent.findOneAndUpdate({ $or: [{ status: "pending", nextAttemptAt: { $lte: now } }, { status: "failed", attempts: { $lt: MAX_ATTEMPTS }, nextAttemptAt: { $lte: now } }, { status: "processing", lockedAt: { $lt: staleBefore } }] }, { $set: { status: "processing", lockedAt: now }, $inc: { attempts: 1 } }, { sort: { priority: -1, nextAttemptAt: 1, createdAt: 1 }, new: true }).lean(); }
async function processEvent(event: NonNullable<Awaited<ReturnType<typeof claimNextEvent>>>) {
  const expiresAt = typeof event.payload?.expiresAt === "string" ? new Date(event.payload.expiresAt) : undefined;
  if (expiresAt && expiresAt <= new Date()) { await NotificationEvent.updateOne({ _id: event._id }, { $set: { status: "completed", processedAt: new Date() }, $unset: { lockedAt: 1 } }); return; }
  const users = await User.find({ _id: { $in: event.recipientIds }, schoolId: event.schoolId, isActive: true }).select("_id").lean();
  const validRecipientIds = users.map((user) => user._id);
  const preferences = await NotificationPreference.find({ schoolId: event.schoolId, userId: { $in: validRecipientIds }, category: event.category }).lean();
  const preferenceByUser = new Map(preferences.map((p) => [p.userId.toString(), p.channels as NotificationChannel[]]));
  const mandatory = event.category === "system" || event.priority === "urgent";
  const operations = validRecipientIds.filter((recipientId) => mandatory || (preferenceByUser.get(recipientId.toString()) ?? ["in_app"]).includes("in_app")).map((recipientId) => ({ updateOne: { filter: { schoolId: event.schoolId, recipientId, idempotencyKey: `${event.idempotencyKey}:${recipientId.toString()}` }, update: { $setOnInsert: { schoolId: event.schoolId, recipientId, category: event.category, priority: event.priority, title: event.title, message: event.message, sourceEventId: event._id.toString(), idempotencyKey: `${event.idempotencyKey}:${recipientId.toString()}`, metadata: event.payload } }, upsert: true } }));
  if (operations.length) await Notification.bulkWrite(operations, { ordered: false });
  await NotificationEvent.updateOne({ _id: event._id }, { $set: { status: "completed", processedAt: new Date() }, $unset: { lockedAt: 1, lastError: 1 } });
}
export async function processOneNotificationEvent() { const event = await claimNextEvent(); if (!event) return false; try { await processEvent(event); } catch (error) { const message = error instanceof Error ? error.message : "Notification processing failed"; const exhausted = event.attempts >= MAX_ATTEMPTS; await NotificationEvent.updateOne({ _id: event._id }, { $set: { status: exhausted ? "failed" : "pending", nextAttemptAt: new Date(Date.now() + retryDelay(event.attempts)), lastError: message.slice(0, 1000) }, $unset: { lockedAt: 1 } }); } return true; }
export async function startNotificationWorker() { let running = false; const tick = async () => { if (running) return; running = true; try { while (await processOneNotificationEvent()) { /* drain */ } } finally { running = false; } }; await tick(); return setInterval(() => { void tick(); }, 5000); }
