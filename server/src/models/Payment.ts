import mongoose, { Document, Schema, Types } from "mongoose";
import { PaymentMode } from "@school-erp/shared";

export interface IPayment extends Document {
  feeId: Types.ObjectId;
  studentId: Types.ObjectId;
  schoolId: Types.ObjectId;
  amount: number;
  mode: PaymentMode;
  transactionId?: string;
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
  receiptNo: { type: String, required: true, unique: true, maxlength: 20 },
  collectedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true }
}, { timestamps: true });

PaymentSchema.index({ schoolId: 1, feeId: 1 });
PaymentSchema.index({ schoolId: 1, studentId: 1, date: 1 });
PaymentSchema.index({ schoolId: 1, date: 1 });

export const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);
