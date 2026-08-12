import mongoose, { Document, Schema, Types } from "mongoose";
import { FeeStatus } from "@school-erp/shared";

export interface IFee extends Document {
  studentId: Types.ObjectId;
  schoolId: Types.ObjectId;
  feeStructureId: Types.ObjectId;
  amount: number;
  discount: number;
  fine: number;
  totalDue: number;
  paidAmount: number;
  balance: number;
  status: FeeStatus;
  academicYear: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FeeSchema = new Schema<IFee>({
  studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  feeStructureId: { type: Schema.Types.ObjectId, ref: "FeeStructure", required: true },
  amount: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  fine: { type: Number, default: 0, min: 0 },
  totalDue: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, default: 0, min: 0 },
  balance: { type: Number, required: true, min: 0 },
  status: { type: String, enum: Object.values(FeeStatus), default: FeeStatus.PENDING },
  academicYear: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true }
}, { timestamps: true });

FeeSchema.index({ schoolId: 1, studentId: 1, academicYear: 1, status: 1 });
FeeSchema.index({ schoolId: 1, feeStructureId: 1 });
FeeSchema.index({ schoolId: 1, status: 1, balance: 1 });

export const Fee = mongoose.model<IFee>("Fee", FeeSchema);