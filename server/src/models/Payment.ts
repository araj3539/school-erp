import mongoose, { Document, Schema, Types } from "mongoose";
import { PaymentMode } from "@school-erp/shared";
import { Fee } from "./Fee.js";
import { Student } from "./Student.js";

export interface IPayment extends Document {
  feeId: Types.ObjectId;
  studentId: Types.ObjectId;
  schoolId: Types.ObjectId;
  amount: number;
  mode: PaymentMode;
  transactionId?: string;
  idempotencyKey?: string;
  receiptNo: string;
  collectedBy: Types.ObjectId;
  date: Date;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  feeId: { type: Schema.Types.ObjectId, ref: "Fee", required: true },
  studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  amount: { type: Number, required: true, min: 0 },
  mode: { type: String, enum: Object.values(PaymentMode), required: true },
  transactionId: { type: String, maxlength: 100 },
  idempotencyKey: { type: String, maxlength: 100, trim: true },
  receiptNo: { type: String, required: true, unique: true, maxlength: 20 },
  collectedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true }
}, { timestamps: true });

PaymentSchema.pre("validate", async function () {
  const [fee, student] = await Promise.all([
    Fee.exists({ _id: this.feeId, schoolId: this.schoolId, studentId: this.studentId }),
    Student.exists({ _id: this.studentId, schoolId: this.schoolId })
  ]);
  if (!fee) throw new Error("Payment fee must belong to the selected student and school");
  if (!student) throw new Error("Payment student must belong to the same school");
});

// Financial ledger entries are immutable. Corrections must use a reversal/refund record.
PaymentSchema.pre("save", function () {
  if (!this.isNew && this.isModified()) {
    throw new Error("Payment records are immutable; create a reversal or refund instead");
  }
});
PaymentSchema.pre("findOneAndUpdate", function () {
  throw new Error("Payment records are immutable; create a reversal or refund instead");
});
PaymentSchema.pre("updateOne", function () {
  throw new Error("Payment records are immutable; create a reversal or refund instead");
});
PaymentSchema.pre("updateMany", function () {
  throw new Error("Payment records are immutable; create a reversal or refund instead");
});
PaymentSchema.pre("findOneAndDelete", function () {
  throw new Error("Payment records are immutable; create a reversal or refund instead");
});
PaymentSchema.pre("deleteOne", function () {
  throw new Error("Payment records are immutable; create a reversal or refund instead");
});
PaymentSchema.pre("deleteMany", function () {
  throw new Error("Payment records are immutable; create a reversal or refund instead");
});

PaymentSchema.index({ schoolId: 1, feeId: 1 });
PaymentSchema.index({ schoolId: 1, studentId: 1, date: 1 });
PaymentSchema.index({ schoolId: 1, date: 1 });
PaymentSchema.index({ schoolId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });
PaymentSchema.index({ schoolId: 1, transactionId: 1 }, { unique: true, sparse: true });

export const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);
