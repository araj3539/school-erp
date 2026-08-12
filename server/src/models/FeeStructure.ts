import mongoose, { Document, Schema, Types } from "mongoose";
import { FeeType } from "@school-erp/shared";

export interface IFeeStructure extends Document {
  classId: Types.ObjectId;
  schoolId: Types.ObjectId;
  feeType: FeeType;
  amount: number;
  dueDate?: Date;
  academicYear: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FeeStructureSchema = new Schema<IFeeStructure>({
  classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  feeType: { type: String, enum: Object.values(FeeType), required: true },
  amount: { type: Number, required: true, min: 0 },
  dueDate: { type: Date },
  academicYear: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true }
}, { timestamps: true });

FeeStructureSchema.index({ schoolId: 1, classId: 1, feeType: 1, academicYear: 1 }, { unique: true });

export const FeeStructure = mongoose.model<IFeeStructure>("FeeStructure", FeeStructureSchema);