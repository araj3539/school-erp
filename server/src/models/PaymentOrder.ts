import mongoose, { Document, Schema, Types } from "mongoose";
import { Fee } from "./Fee.js";
import { Student } from "./Student.js";

export const PAYMENT_ORDER_STATUSES = ["created", "pending", "paid", "failed", "expired", "cancelled", "partially_refunded", "refunded"] as const;
export type PaymentOrderStatus = (typeof PAYMENT_ORDER_STATUSES)[number];

export interface IPaymentOrder extends Document {
  schoolId: Types.ObjectId;
  feeId: Types.ObjectId;
  studentId: Types.ObjectId;
  amount: number;
  currency: string;
  status: PaymentOrderStatus;
  idempotencyKey: string;
  utr?: string;
  payerUpiId?: string;
  submittedAt?: Date;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
  rejectionReason?: string;
  expiresAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentOrderSchema = new Schema<IPaymentOrder>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  feeId: { type: Schema.Types.ObjectId, ref: "Fee", required: true },
  studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  amount: { type: Number, required: true, min: 0.01 },
  currency: { type: String, required: true, enum: ["INR"], default: "INR" },
  status: { type: String, required: true, enum: PAYMENT_ORDER_STATUSES, default: "created" },
  idempotencyKey: { type: String, required: true, maxlength: 100, trim: true },
  utr: { type: String, trim: true, uppercase: true, maxlength: 35 },
  payerUpiId: { type: String, trim: true, lowercase: true, maxlength: 255 },
  submittedAt: Date,
  verifiedAt: Date,
  verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
  rejectionReason: { type: String, trim: true, maxlength: 500 },
  expiresAt: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

PaymentOrderSchema.index({ schoolId: 1, idempotencyKey: 1 }, { unique: true });
PaymentOrderSchema.index({ schoolId: 1, feeId: 1, status: 1 });
PaymentOrderSchema.index({ schoolId: 1, utr: 1 }, { unique: true, sparse: true });
PaymentOrderSchema.index({ schoolId: 1, status: 1, submittedAt: -1 });

PaymentOrderSchema.pre("validate", async function () {
  const [fee, student] = await Promise.all([
    Fee.exists({ _id: this.feeId, schoolId: this.schoolId, studentId: this.studentId }),
    Student.exists({ _id: this.studentId, schoolId: this.schoolId })
  ]);
  if (!fee) throw new Error("Payment order fee must belong to the selected student and school");
  if (!student) throw new Error("Payment order student must belong to the same school");
  if (this.utr && this.utr.length < 6) throw new Error("UTR must contain at least 6 characters");
});

export const PaymentOrder = mongoose.model<IPaymentOrder>("PaymentOrder", PaymentOrderSchema);
