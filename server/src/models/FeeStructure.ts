import mongoose, { Document, Schema, Types } from "mongoose";
import { FeeType } from "@school-erp/shared";
import { Class } from "./Class.js";

export type FeeStructureStatus = "draft" | "active" | "archived";
export type FeePolicyValueType = "fixed" | "percent";
export interface IFeeInstallment { name: string; amount: number; dueDate: Date; }
export interface IFeeConcessionRule { name: string; code: string; valueType: FeePolicyValueType; value: number; active: boolean; }
export interface IFeeLateFeePolicy { enabled: boolean; graceDays: number; valueType: FeePolicyValueType; value: number; maxAmount?: number; }
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
  concessionRules: IFeeConcessionRule[];
  lateFeePolicy: IFeeLateFeePolicy;
  installments: IFeeInstallment[];
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IFeeStructure>({
  classId: { type: Schema.Types.ObjectId, ref: "Class", required: true }, schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  feeType: { type: String, enum: Object.values(FeeType), required: true }, amount: { type: Number, required: true, min: 0 }, dueDate: { type: Date },
  academicYear: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true }, status: { type: String, enum: ["draft", "active", "archived"], default: "draft", index: true },
  concessionPercent: { type: Number, min: 0, max: 100, default: 0 }, concessionAmount: { type: Number, min: 0, default: 0 },
  concessionRules: { type: [{ name: { type: String, required: true, trim: true, maxlength: 100 }, code: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 }, valueType: { type: String, enum: ["fixed", "percent"], required: true }, value: { type: Number, required: true, min: 0 }, active: { type: Boolean, default: true } }], default: [] },
  lateFeePolicy: { type: { enabled: { type: Boolean, default: false }, graceDays: { type: Number, min: 0, default: 0 }, valueType: { type: String, enum: ["fixed", "percent"], default: "fixed" }, value: { type: Number, min: 0, default: 0 }, maxAmount: { type: Number, min: 0 } }, default: () => ({ enabled: false, graceDays: 0, valueType: "fixed", value: 0 }) },
  installments: { type: [{ name: { type: String, required: true, trim: true, maxlength: 80 }, amount: { type: Number, required: true, min: 0 }, dueDate: { type: Date, required: true } }], default: [] },
}, { timestamps: true });
schema.pre("validate", async function () {
  const classDoc = await Class.exists({ _id: this.classId, schoolId: this.schoolId }); if (!classDoc) throw new Error("Fee structure class must belong to the same school");
  const installmentTotal = this.installments.reduce((sum, item) => sum + item.amount, 0);
  if (installmentTotal > 0 && Math.abs(installmentTotal - this.amount) > 0.01) throw new Error("Installments must total the fee amount");
  if (this.concessionAmount > this.amount) throw new Error("Concession amount cannot exceed fee amount");
  if (this.concessionPercent > 0 && this.concessionAmount > 0) throw new Error("Use either concession percent or concession amount");
  for (const rule of this.concessionRules) {
    if (rule.valueType === "percent" && rule.value > 100) throw new Error("Concession rule percentage cannot exceed 100");
    if (rule.valueType === "fixed" && rule.value > this.amount) throw new Error("Concession rule amount cannot exceed fee amount");
  }
  if (this.lateFeePolicy?.valueType === "percent" && this.lateFeePolicy.value > 100) throw new Error("Late fee percentage cannot exceed 100");
});
schema.index({ schoolId: 1, classId: 1, feeType: 1, academicYear: 1 }, { unique: true });
schema.index({ schoolId: 1, academicYear: 1, status: 1 });
export const FeeStructure = mongoose.model<IFeeStructure>("FeeStructure", schema);
