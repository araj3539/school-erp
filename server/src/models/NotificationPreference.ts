import { Document, Schema, Types, model } from "mongoose";
import type { NotificationCategory } from "./Notification.js";

export type NotificationChannel = "in_app" | "email" | "sms" | "push";

export interface INotificationPreference extends Document {
  schoolId: Types.ObjectId;
  userId: Types.ObjectId;
  category: NotificationCategory;
  channels: NotificationChannel[];
  quietHours?: { start: string; end: string };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  category: {
    type: String,
    enum: ["announcement", "attendance", "homework", "result", "fee", "system"],
    required: true,
  },
  channels: {
    type: [{ type: String, enum: ["in_app", "email", "sms", "push"] }],
    default: ["in_app"],
    required: true,
  },
  quietHours: {
    start: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    end: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  },
}, { timestamps: true });

NotificationPreferenceSchema.index({ schoolId: 1, userId: 1, category: 1 }, { unique: true });

export const NotificationPreference = model<INotificationPreference>(
  "NotificationPreference",
  NotificationPreferenceSchema,
);
