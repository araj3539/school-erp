import { Document, Schema, Types, model } from "mongoose";
import type { NotificationCategory, NotificationPriority } from "./Notification.js";

export type NotificationEventStatus = "pending" | "processing" | "completed" | "failed";

export interface INotificationEvent extends Document {
  schoolId: Types.ObjectId;
  eventType: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  recipientIds: Types.ObjectId[];
  title: string;
  message: string;
  idempotencyKey: string;
  payload?: Record<string, unknown>;
  status: NotificationEventStatus;
  attempts: number;
  nextAttemptAt: Date;
  lastError?: string;
  lockedAt?: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationEventSchema = new Schema<INotificationEvent>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  eventType: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, enum: ["announcement", "attendance", "homework", "result", "fee", "system"], required: true },
  priority: { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal", required: true },
  recipientIds: { type: [Schema.Types.ObjectId], ref: "User", required: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  idempotencyKey: { type: String, required: true, trim: true, maxlength: 300 },
  payload: { type: Schema.Types.Mixed },
  status: { type: String, enum: ["pending", "processing", "completed", "failed"], default: "pending", required: true },
  attempts: { type: Number, default: 0, min: 0 },
  nextAttemptAt: { type: Date, default: Date.now, required: true },
  lastError: { type: String, maxlength: 1000 },
  lockedAt: { type: Date },
  processedAt: { type: Date },
}, { timestamps: true });

NotificationEventSchema.index({ schoolId: 1, status: 1, nextAttemptAt: 1 });
NotificationEventSchema.index({ schoolId: 1, status: 1, lockedAt: 1 });
NotificationEventSchema.index({ schoolId: 1, createdAt: -1 });
NotificationEventSchema.index({ schoolId: 1, idempotencyKey: 1 }, { unique: true });

export const NotificationEvent = model<INotificationEvent>("NotificationEvent", NotificationEventSchema);
