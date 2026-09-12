import mongoose, { Document, Schema, Types } from "mongoose";
import { FeeType } from "@school-erp/shared";
import { Class } from "./Class.js";

export type FeeStructureStatus = "draft" | "active" | "archived";
export interface IFeeInstallment { name: string; amount: number; dueDate: Date; }
export interface IFeeStructure extends Document {
  classId: Types.ObjectId;
  schoolId: Types.ObjectId;
  feeType: FeeType;
  amount: number;
  dueDate?: Date;
  academicYear: Types.ObjectId;
  status: FeeStructureStatus;
  concessionPercent: number;
  concessionAmount: number;
  installments: IFeeInstallment[];
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IFeeStructure>({
  classId: { type: Schema.Types.ObjectId, ref: "Class", required: true }, schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  feeType: { type: String, enum: Object.values(FeeType), required: true }, amount: { type: Number, required: true, min: 0 }, dueDate: { type: Date },
  academicYear: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true }, status: { type: String, enum: ["draft", "active", "archived"], default: "draft", index: true },
  concessionPercent: { type: Number, min: 0, max: 100, default: 0 }, concessionAmount: { type: Number, min: 0, default: 0 },
  installments: { type: [{ name: { type: String, required: true, trim: true, maxlength: 80 }, amount: { type: Number, required: true, min: 0 }, dueDate: { type: Date, required: true } }], default: [] },
}, { timestamps: true });
schema.pre("validate", async function () {
  const classDoc = await Class.exists({ _id: this.classId, schoolId: this.schoolId }); if (!classDoc) throw new Error("Fee structure class must belong to the same school");
  const installmentTotal = this.installments.reduce((sum, item) => sum + item.amount, 0);
  if (installmentTotal > 0 && Math.abs(installmentTotal - this.amount) > 0.01) throw new Error("Installments must total the fee amount");
  if (this.concessionAmount > this.amount) throw new Error("Concession amount cannot exceed fee amount");
});
schema.index({ schoolId: 1, classId: 1, feeType: 1, academicYear: 1 }, { unique: true });
schema.index({ schoolId: 1, academicYear: 1, status: 1 });
export const FeeStructure = mongoose.model<IFeeStructure>("FeeStructure", schema);
