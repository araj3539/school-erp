import mongoose, { Document, Schema, Types } from "mongoose";
import type { UsageDimension } from "./TenantUsage.js";

export interface ITenantLimit extends Document {
  schoolId: Types.ObjectId;
  dimension: UsageDimension;
  limit: number;
  createdAt: Date;
  updatedAt: Date;
}

const TenantLimitSchema = new Schema<ITenantLimit>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, immutable: true },
  dimension: { type: String, enum: ["students", "school_users", "storage_bytes"], required: true, immutable: true },
  limit: { type: Number, min: 0, required: true },
}, { timestamps: true });

TenantLimitSchema.index({ schoolId: 1, dimension: 1 }, { unique: true, name: "schoolId_1_dimension_1_unique" });

export const TenantLimit = mongoose.model<ITenantLimit>("TenantLimit", TenantLimitSchema);
