import mongoose, { Document, Schema, Types } from "mongoose";

export type AdmissionStage = "enquiry" | "contacted" | "visit" | "application" | "documents" | "assessment" | "accepted" | "rejected" | "converted";

export interface IAdmissionEnquiry extends Document {
  schoolId: Types.ObjectId;
  studentName: string;
  guardianName: string;
  phone?: string;
  email?: string;
  source?: string;
  stage: AdmissionStage;
  classId?: Types.ObjectId;
  followUpAt?: Date;
  notes?: string;
  convertedStudentId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IAdmissionEnquiry>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  studentName: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
  guardianName: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
  phone: { type: String, trim: true, maxlength: 30 },
  email: { type: String, trim: true, lowercase: true, maxlength: 254 },
  source: { type: String, trim: true, maxlength: 80 },
  stage: { type: String, enum: ["enquiry", "contacted", "visit", "application", "documents", "assessment", "accepted", "rejected", "converted"], default: "enquiry", required: true },
  classId: { type: Schema.Types.ObjectId, ref: "Class" },
  followUpAt: { type: Date },
  notes: { type: String, trim: true, maxlength: 3000 },
  convertedStudentId: { type: Schema.Types.ObjectId, ref: "Student" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

schema.index({ schoolId: 1, stage: 1, followUpAt: 1 });
schema.index({ schoolId: 1, createdAt: -1 });
schema.index({ schoolId: 1, phone: 1 });

export const AdmissionEnquiry = mongoose.model<IAdmissionEnquiry>("AdmissionEnquiry", schema);
