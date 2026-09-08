import mongoose, { Document, Schema, Types } from "mongoose";

export const TENANT_STATUSES = ["active", "suspended", "archived"] as const;
export type TenantStatus = typeof TENANT_STATUSES[number];

export interface ISchool extends Document {
  code: string;
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  session: string;
  academicYear: Types.ObjectId;
  settings: Record<string, unknown>;
  tenantStatus: TenantStatus;
  suspendedAt?: Date;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SchoolSchema = new Schema<ISchool>({
  code: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true,
    immutable: true,
    default: function (this: { _id: Types.ObjectId }) {
      return `SCH-${this._id.toString().slice(-8).toUpperCase()}`;
    }
  },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  logo: { type: String },
  address: { type: String, required: true, maxlength: 500 },
  phone: { type: String, required: true, maxlength: 20 },
  email: { type: String, required: true, lowercase: true, trim: true },
  session: { type: String, required: true, maxlength: 20 },
  academicYear: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true },
  settings: { type: Schema.Types.Mixed, default: {} },
  tenantStatus: { type: String, enum: TENANT_STATUSES, default: "active", index: true },
  suspendedAt: { type: Date },
  archivedAt: { type: Date }
}, { timestamps: true });

SchoolSchema.index({ tenantStatus: 1, createdAt: -1 });

export const School = mongoose.model<ISchool>("School", SchoolSchema);
