import mongoose, { Document, Schema, Types } from "mongoose";

export type TenantProvisioningStatus = "completed";

export interface ITenantProvisioning extends Document {
  idempotencyKey: string;
  requestFingerprint: string;
  schoolId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  adminUserId: Types.ObjectId;
  status: TenantProvisioningStatus;
  createdAt: Date;
  updatedAt: Date;
}

const TenantProvisioningSchema = new Schema<ITenantProvisioning>({
  idempotencyKey: { type: String, required: true, unique: true, immutable: true, trim: true, maxlength: 128 },
  requestFingerprint: { type: String, required: true, immutable: true, match: /^[a-f0-9]{64}$/ },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, unique: true, immutable: true },
  academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, immutable: true },
  adminUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  status: { type: String, enum: ["completed"], required: true, default: "completed", immutable: true },
}, { timestamps: true });

TenantProvisioningSchema.index({ idempotencyKey: 1 }, { unique: true });
TenantProvisioningSchema.index({ schoolId: 1 }, { unique: true });

export const TenantProvisioning = mongoose.model<ITenantProvisioning>("TenantProvisioning", TenantProvisioningSchema);
