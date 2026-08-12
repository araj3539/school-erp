import mongoose, { Document, Schema, Types } from "mongoose";
import { TeacherStatus, DocumentType } from "@school-erp/shared";

export interface ITeacherDocument {
  type: DocumentType;
  url: string;
  uploadedAt: Date;
}

export interface ITeacher extends Document {
  employeeId: string;
  userId?: Types.ObjectId;
  schoolId: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  qualification: string;
  experience: number;
  joiningDate: Date;
  salary: number;
  subjects: Types.ObjectId[];
  classTeacherOf: Types.ObjectId[];
  documents: ITeacherDocument[];
  status: TeacherStatus;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherDocumentSchema = new Schema<ITeacherDocument>({
  type: { type: String, enum: Object.values(DocumentType), required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const TeacherSchema = new Schema<ITeacher>({
  employeeId: { type: String, required: true, unique: true, maxlength: 20 },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  firstName: { type: String, required: true, maxlength: 50 },
  lastName: { type: String, required: true, maxlength: 50 },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, maxlength: 20 },
  qualification: { type: String, required: true, maxlength: 200 },
  experience: { type: Number, default: 0, min: 0 },
  joiningDate: { type: Date, required: true },
  salary: { type: Number, default: 0, min: 0 },
  subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
  classTeacherOf: [{ type: Schema.Types.ObjectId, ref: "Class" }],
  documents: { type: [TeacherDocumentSchema], default: [] },
  status: { type: String, enum: Object.values(TeacherStatus), default: TeacherStatus.ACTIVE }
}, { timestamps: true });

TeacherSchema.index({ employeeId: 1 }, { unique: true });
TeacherSchema.index({ email: 1 }, { unique: true });
TeacherSchema.index({ schoolId: 1, status: 1 });

TeacherSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

TeacherSchema.set("toJSON", { virtuals: true });
TeacherSchema.set("toObject", { virtuals: true });

export const Teacher = mongoose.model<ITeacher>("Teacher", TeacherSchema);