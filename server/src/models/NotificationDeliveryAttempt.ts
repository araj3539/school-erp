import { Document, Schema, Types, model } from "mongoose";
import type { NotificationChannel } from "./NotificationPreference.js";
import type { NotificationPriority } from "./Notification.js";

export type NotificationDeliveryAttemptStatus = "processing" | "succeeded" | "retrying" | "dead_letter";

export interface INotificationDeliveryAttempt extends Document {
  schoolId: Types.ObjectId;
  eventId: Types.ObjectId;
  recipientId?: Types.ObjectId;
  channel: NotificationChannel;
  priority: NotificationPriority;
  attempt: number;
  status: NotificationDeliveryAttemptStatus;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  nextRetryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationDeliveryAttemptSchema = new Schema<INotificationDeliveryAttempt>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  eventId: { type: Schema.Types.ObjectId, ref: "NotificationEvent", required: true },
  recipientId: { type: Schema.Types.ObjectId, ref: "User" },
  channel: { type: String, enum: ["in_app", "email", "sms", "push"], required: true },
  priority: { type: String, enum: ["low", "normal", "high", "urgent"], required: true },
  attempt: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ["processing", "succeeded", "retrying", "dead_letter"], required: true },
  startedAt: { type: Date, required: true },
  completedAt: { type: Date },
  error: { type: String, maxlength: 1000 },
  nextRetryAt: { type: Date },
}, { timestamps: true });

NotificationDeliveryAttemptSchema.index({ schoolId: 1, eventId: 1, createdAt: -1 });
NotificationDeliveryAttemptSchema.index({ schoolId: 1, status: 1, createdAt: -1 });
NotificationDeliveryAttemptSchema.index({ schoolId: 1, nextRetryAt: 1 });

export const NotificationDeliveryAttempt = model<INotificationDeliveryAttempt>("NotificationDeliveryAttempt", NotificationDeliveryAttemptSchema);
