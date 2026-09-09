import mongoose, { Document, Schema, Types } from "mongoose";

export type SaaSPlanStatus = "active" | "retired";
export type BillingInterval = "month" | "year";

export interface ISaaSPlan extends Document {
  productId: Types.ObjectId;
  code: string;
  name: string;
  description?: string;
  version: number;
  currency: string;
  amountMinor: number;
  billingInterval: BillingInterval;
  trialDays: number;
  includedModules: string[];
  status: SaaSPlanStatus;
  effectiveAt: Date;
  retiredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SaaSPlanSchema = new Schema<ISaaSPlan>({
  productId: { type: Schema.Types.ObjectId, ref: "SaaSProduct", required: true, immutable: true },
  code: { type: String, required: true, immutable: true, trim: true, lowercase: true, match: /^[a-z0-9][a-z0-9._-]{1,63}$/ },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 500 },
  version: { type: Number, required: true, immutable: true, min: 1 },
  currency: { type: String, required: true, immutable: true, uppercase: true, match: /^[A-Z]{3}$/ },
  amountMinor: { type: Number, required: true, immutable: true, min: 0, max: 2147483647 },
  billingInterval: { type: String, enum: ["month", "year"], required: true, immutable: true },
  trialDays: { type: Number, required: true, immutable: true, min: 0, max: 3650, default: 0 },
  includedModules: { type: [String], required: true, immutable: true, default: [] },
  status: { type: String, enum: ["active", "retired"], required: true, default: "active" },
  effectiveAt: { type: Date, required: true, immutable: true },
  retiredAt: { type: Date },
}, { timestamps: true });

SaaSPlanSchema.index({ productId: 1, code: 1, version: 1 }, { unique: true, name: "productId_1_code_1_version_1" });
SaaSPlanSchema.index({ productId: 1, status: 1 }, { name: "productId_1_status_1" });

export const SaaSPlan = mongoose.model<ISaaSPlan>("SaaSPlan", SaaSPlanSchema);
