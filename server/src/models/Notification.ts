import { Document, Schema, Types, model } from "mongoose";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";
export type NotificationCategory =
  | "announcement"
  | "attendance"
  | "homework"
  | "result"
  | "fee"
  | "system";

export interface INotification extends Document {
  schoolId: Types.ObjectId;
  recipientId: Types.ObjectId;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  sourceEventId: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  category: {
    type: String,
    enum: ["announcement", "attendance", "homework", "result", "fee", "system"],
    required: true,
  },
  priority: {
    type: String,
    enum: ["low", "normal", "high", "urgent"],
    default: "normal",
    required: true,
  },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  sourceEventId: { type: String, required: true, trim: true, maxlength: 200 },
  idempotencyKey: { type: String, required: true, trim: true, maxlength: 300 },
  metadata: { type: Schema.Types.Mixed },
  readAt: { type: Date },
}, { timestamps: true });

NotificationSchema.index({ schoolId: 1, recipientId: 1, createdAt: -1 });
NotificationSchema.index({ schoolId: 1, recipientId: 1, readAt: 1, createdAt: -1 });
NotificationSchema.index({ schoolId: 1, recipientId: 1, idempotencyKey: 1 }, { unique: true });

export const Notification = model<INotification>("Notification", NotificationSchema);
