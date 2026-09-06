import { Types } from "mongoose";
import { Notification, NotificationEvent, NotificationPreference, User } from "../models/index.js";
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

function retryDelay(attempt: number) { return Math.min(60_000, 1000 * 2 ** Math.max(0, attempt - 1)); }

async function claimNextEvent() {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - LOCK_TIMEOUT_MS);
  return NotificationEvent.findOneAndUpdate(
    { $or: [
      { status: "pending", nextAttemptAt: { $lte: now } },
      { status: "failed", attempts: { $lt: MAX_ATTEMPTS }, nextAttemptAt: { $lte: now } },
      { status: "processing", lockedAt: { $lt: staleBefore } },
    ] },
    { $set: { status: "processing", lockedAt: now }, $inc: { attempts: 1 } },
    { sort: { priority: -1, nextAttemptAt: 1, createdAt: 1 }, new: true },
  ).lean();
}

async function processEvent(event: NonNullable<Awaited<ReturnType<typeof claimNextEvent>>>) {
  const expiresAt = typeof event.payload?.expiresAt === "string" ? new Date(event.payload.expiresAt) : undefined;
  if (expiresAt && expiresAt <= new Date()) {
    await NotificationEvent.updateOne({ _id: event._id }, { $set: { status: "completed", processedAt: new Date() }, $unset: { lockedAt: 1 } });
    return;
  }
  const users = await User.find({ _id: { $in: event.recipientIds }, schoolId: event.schoolId, isActive: true }).select("_id").lean();
  const validRecipientIds = users.map((user) => user._id);
  const preferences = await NotificationPreference.find({ schoolId: event.schoolId, userId: { $in: validRecipientIds }, category: event.category }).lean();
  const preferenceByUser = new Map(preferences.map((p) => [p.userId.toString(), p.channels as NotificationChannel[]]));
  const mandatory = event.category === "system" || event.priority === "urgent";
  const operations = validRecipientIds.filter((recipientId) => mandatory || (preferenceByUser.get(recipientId.toString()) ?? ["in_app"]).includes("in_app")).map((recipientId) => ({
    updateOne: {
      filter: { schoolId: event.schoolId, recipientId, idempotencyKey: `${event.idempotencyKey}:${recipientId.toString()}` },
      update: { $setOnInsert: { schoolId: event.schoolId, recipientId, category: event.category, priority: event.priority, title: event.title, message: event.message, sourceEventId: event._id.toString(), idempotencyKey: `${event.idempotencyKey}:${recipientId.toString()}`, metadata: event.payload } },
      upsert: true,
    },
  }));
  if (operations.length) await Notification.bulkWrite(operations, { ordered: false });
  await NotificationEvent.updateOne({ _id: event._id }, { $set: { status: "completed", processedAt: new Date() }, $unset: { lockedAt: 1, lastError: 1 } });
}

export async function processOneNotificationEvent() {
  const event = await claimNextEvent();
  if (!event) return false;
  try { await processEvent(event); }
  catch (error) {
    const message = error instanceof Error ? error.message : "Notification processing failed";
    const exhausted = event.attempts >= MAX_ATTEMPTS;
    await NotificationEvent.updateOne({ _id: event._id }, { $set: { status: exhausted ? "failed" : "pending", nextAttemptAt: new Date(Date.now() + retryDelay(event.attempts)), lastError: message.slice(0, 1000) }, $unset: { lockedAt: 1 } });
  }
  return true;
}

export async function startNotificationWorker() {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try { while (await processOneNotificationEvent()) { /* drain */ } }
    finally { running = false; }
  };
  await tick();
  return setInterval(() => { void tick(); }, 5000);
}
