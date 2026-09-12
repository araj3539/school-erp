import { Document, Schema, Types, model } from "mongoose";
import type { NotificationCategory } from "./Notification.js";

export interface INotificationTemplate extends Document {
  schoolId: Types.ObjectId;
  name: string;
  category: NotificationCategory;
  subject?: string;
  body: string;
  channels: string[];
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<INotificationTemplate>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  name: { type: String, trim: true, minlength: 2, maxlength: 100, required: true },
  category: { type: String, enum: ["announcement", "attendance", "homework", "result", "fee", "system"], required: true },
  subject: { type: String, trim: true, maxlength: 200 },
  body: { type: String, trim: true, minlength: 1, maxlength: 5000, required: true },
  channels: { type: [String], default: ["in_app"] },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
schema.index({ schoolId: 1, category: 1, name: 1 }, { unique: true });
export const NotificationTemplate = model<INotificationTemplate>("NotificationTemplate", schema);
