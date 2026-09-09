import mongoose, { Document, Schema } from "mongoose";

export type SaaSProductStatus = "active" | "retired";

export interface ISaaSProduct extends Document {
  code: string;
  name: string;
  description?: string;
  version: number;
  status: SaaSProductStatus;
  effectiveAt: Date;
  retiredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SaaSProductSchema = new Schema<ISaaSProduct>({
  code: { type: String, required: true, immutable: true, trim: true, lowercase: true, match: /^[a-z0-9][a-z0-9._-]{1,63}$/ },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 500 },
  version: { type: Number, required: true, immutable: true, min: 1 },
  status: { type: String, enum: ["active", "retired"], required: true, default: "active" },
  effectiveAt: { type: Date, required: true, immutable: true },
  retiredAt: { type: Date },
}, { timestamps: true });

SaaSProductSchema.index({ code: 1, version: 1 }, { unique: true, name: "code_1_version_1" });
SaaSProductSchema.index({ code: 1, status: 1 }, { name: "code_1_status_1" });

export const SaaSProduct = mongoose.model<ISaaSProduct>("SaaSProduct", SaaSProductSchema);
