import mongoose, { Document, Schema, Types } from "mongoose";
import { StudentStatus, Gender, BloodGroup, DocumentType } from "@school-erp/shared";

export interface IStudentDocument {
  type: DocumentType;
  url: string;
  uploadedAt: Date;
}

export interface IStudent extends Document {
  admissionNo: string;
  userId?: Types.ObjectId;
  schoolId: Types.ObjectId;
  classId?: Types.ObjectId;
  sectionId?: Types.ObjectId;
  firstName: string;
  lastName: string;
  dob: Date;
  gender: Gender;
  bloodGroup?: BloodGroup;
  religion?: string;
  category?: string;
  fatherName: string;
  motherName: string;
  phone: string;
  address: string;
  guardianPhone?: string;
  previousSchool?: string;
  transportId?: Types.ObjectId;
  documents: IStudentDocument[];
  status: StudentStatus;
  admissionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StudentDocumentSchema = new Schema<IStudentDocument>({
  type: { type: String, enum: Object.values(DocumentType), required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const StudentSchema = new Schema<IStudent>({
  admissionNo: { type: String, required: true, unique: true, maxlength: 20 },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  classId: { type: Schema.Types.ObjectId, ref: "Class" },
  sectionId: { type: Schema.Types.ObjectId, ref: "Section" },
  firstName: { type: String, required: true, maxlength: 50 },
  lastName: { type: String, required: true, maxlength: 50 },
  dob: { type: Date, required: true },
  gender: { type: String, enum: Object.values(Gender), required: true },
  bloodGroup: { type: String, enum: Object.values(BloodGroup) },
  religion: { type: String, maxlength: 50 },
  category: { type: String, maxlength: 50 },
  fatherName: { type: String, required: true, maxlength: 100 },
  motherName: { type: String, required: true, maxlength: 100 },
  phone: { type: String, required: true, maxlength: 20 },
  address: { type: String, required: true, maxlength: 500 },
  guardianPhone: { type: String, maxlength: 20 },
  previousSchool: { type: String, maxlength: 100 },
  transportId: { type: Schema.Types.ObjectId, ref: "Transport" },
  documents: { type: [StudentDocumentSchema], default: [] },
  status: { type: String, enum: Object.values(StudentStatus), default: StudentStatus.ACTIVE },
  admissionDate: { type: Date, required: true }
}, { timestamps: true });

StudentSchema.index({ admissionNo: 1 }, { unique: true });
StudentSchema.index({ schoolId: 1, classId: 1, sectionId: 1, status: 1 });
StudentSchema.index({ schoolId: 1, status: 1 });

StudentSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

StudentSchema.set("toJSON", { virtuals: true });
StudentSchema.set("toObject", { virtuals: true });

export const Student = mongoose.model<IStudent>("Student", StudentSchema);