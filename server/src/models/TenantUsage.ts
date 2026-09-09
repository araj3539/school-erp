import mongoose, { Document, Schema, Types } from "mongoose";

export const USAGE_DIMENSIONS = ["students", "school_users", "storage_bytes"] as const;
export type UsageDimension = typeof USAGE_DIMENSIONS[number];

export interface ITenantUsage extends Document {
  schoolId: Types.ObjectId;
  counters: Record<UsageDimension, number>;
  createdAt: Date;
  updatedAt: Date;
}

const TenantUsageSchema = new Schema<ITenantUsage>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, unique: true, immutable: true },
  counters: {
    students: { type: Number, min: 0, default: 0 },
    school_users: { type: Number, min: 0, default: 0 },
    storage_bytes: { type: Number, min: 0, default: 0 },
  },
}, { timestamps: true });

TenantUsageSchema.index({ schoolId: 1 }, { unique: true, name: "schoolId_1_unique" });

export const TenantUsage = mongoose.model<ITenantUsage>("TenantUsage", TenantUsageSchema);
