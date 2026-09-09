import mongoose, { Document, Schema, Types } from "mongoose";
import type { BillingInterval } from "./SaaSPlan.js";

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "suspended" | "cancelled" | "expired";

export interface ISubscription extends Document {
  schoolId: Types.ObjectId;
  productId: Types.ObjectId;
  planId: Types.ObjectId;
  planCode: string;
  planVersion: number;
  status: SubscriptionStatus;
  currency: string;
  amountMinor: number;
  billingInterval: BillingInterval;
  startedAt: Date;
  trialEndsAt?: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAt?: Date;
  cancelledAt?: Date;
  stateRevision: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, immutable: true },
  productId: { type: Schema.Types.ObjectId, ref: "SaaSProduct", required: true },
  planId: { type: Schema.Types.ObjectId, ref: "SaaSPlan", required: true },
  planCode: { type: String, required: true, trim: true, lowercase: true },
  planVersion: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ["trialing", "active", "past_due", "suspended", "cancelled", "expired"], required: true },
  currency: { type: String, required: true, uppercase: true, match: /^[A-Z]{3}$/ },
  amountMinor: { type: Number, required: true, min: 0 },
  billingInterval: { type: String, enum: ["month", "year"], required: true },
  startedAt: { type: Date, required: true, immutable: true },
  trialEndsAt: { type: Date },
  currentPeriodStart: { type: Date, required: true },
  currentPeriodEnd: { type: Date, required: true },
  cancelAt: { type: Date },
  cancelledAt: { type: Date },
  stateRevision: { type: Number, required: true, min: 0, default: 0 },
}, { timestamps: true });

SubscriptionSchema.index({ schoolId: 1 }, { unique: true, name: "schoolId_1_unique" });
SubscriptionSchema.index({ status: 1, currentPeriodEnd: 1 }, { name: "status_1_currentPeriodEnd_1" });
SubscriptionSchema.index({ planId: 1, status: 1 }, { name: "planId_1_status_1" });

export const Subscription = mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
