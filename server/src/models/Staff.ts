import mongoose, { Document, Schema, Types } from "mongoose";
import { StaffEmploymentType, StaffStatus } from "@school-erp/shared";

export interface IStaff extends Document {
  employeeId: string;
  userId?: Types.ObjectId;
  schoolId: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  employmentType: keyof typeof StaffEmploymentType extends never ? string : (typeof StaffEmploymentType)[keyof typeof StaffEmploymentType];
  joiningDate: Date;
  salary: number;
  status: (typeof StaffStatus)[keyof typeof StaffStatus];
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<IStaff>({
  employeeId: { type: String, required: true, trim: true, maxlength: 20 },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  firstName: { type: String, required: true, trim: true, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 120 },
  phone: { type: String, required: true, trim: true, maxlength: 20 },
  department: { type: String, required: true, trim: true, maxlength: 80 },
  designation: { type: String, required: true, trim: true, maxlength: 100 },
  employmentType: { type: String, enum: Object.values(StaffEmploymentType), required: true },
  joiningDate: { type: Date, required: true },
  salary: { type: Number, required: true, min: 0, default: 0 },
  status: { type: String, enum: Object.values(StaffStatus), required: true, default: StaffStatus.ACTIVE }
}, { timestamps: true });

StaffSchema.index({ schoolId: 1, employeeId: 1 }, { unique: true });
StaffSchema.index({ schoolId: 1, email: 1 }, { unique: true });
StaffSchema.index({ schoolId: 1, status: 1, department: 1 });
StaffSchema.index({ schoolId: 1, createdAt: -1 });

export const Staff = mongoose.model<IStaff>("Staff", StaffSchema);
