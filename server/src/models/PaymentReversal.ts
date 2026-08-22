import mongoose, { Document, Schema, Types } from "mongoose";
import { Payment } from "./Payment.js";

export type PaymentReversalType = "reversal" | "refund";

export interface IPaymentReversal extends Document {
  paymentId: Types.ObjectId;
  schoolId: Types.ObjectId;
  amount: number;
  type: PaymentReversalType;
  reason: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const PaymentReversalSchema = new Schema<IPaymentReversal>({
  paymentId: { type: Schema.Types.ObjectId, ref: "Payment", required: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  amount: { type: Number, required: true, min: 0 },
  type: { type: String, enum: ["reversal", "refund"], required: true },
  reason: { type: String, required: true, minlength: 3, maxlength: 500 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

PaymentReversalSchema.pre("validate", async function () {
  const payment = await Payment.findOne({ _id: this.paymentId, schoolId: this.schoolId }).select("_id amount").lean();
  if (!payment) throw new Error("Payment reversal must belong to the same school as the payment");
  if (this.amount > payment.amount) throw new Error("Payment reversal amount cannot exceed the payment amount");
});

PaymentReversalSchema.index({ schoolId: 1, paymentId: 1, createdAt: -1 });
PaymentReversalSchema.index({ schoolId: 1, createdAt: -1 });

export const PaymentReversal = mongoose.model<IPaymentReversal>("PaymentReversal", PaymentReversalSchema);
