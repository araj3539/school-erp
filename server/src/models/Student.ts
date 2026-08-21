import mongoose, { Document, Schema, Types } from "mongoose";
import { StudentStatus, Gender, BloodGroup, DocumentType, UserRole } from "@school-erp/shared";

export interface IStudentDocument {
  type: DocumentType;
  url: string;
  publicId?: string;
  originalName?: string;
  mimeType?: string;
  sizeBytes?: number;
  uploadedAt: Date;
}

export interface IStudent extends Document {
  admissionNo: string;
  userId?: Types.ObjectId;
  parentIds: Types.ObjectId[];
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
  publicId: { type: String },
  originalName: { type: String, maxlength: 255 },
  mimeType: { type: String, maxlength: 100 },
  sizeBytes: { type: Number, min: 0 },
  uploadedAt: { type: Date, default: Date.now }
});

const StudentSchema = new Schema<IStudent>({
  admissionNo: { type: String, required: true, unique: true, maxlength: 20 },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  parentIds: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [], validate: { validator: (ids: Types.ObjectId[]) => new Set(ids.map((id) => id.toString())).size === ids.length, message: "Duplicate parent assignments are not allowed" } },
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

StudentSchema.index({ schoolId: 1, classId: 1, sectionId: 1, status: 1 });
StudentSchema.index({ schoolId: 1, status: 1 });
StudentSchema.index({ schoolId: 1, parentIds: 1, status: 1 });

async function validateStudentRelations(schoolId: unknown, classId?: unknown, sectionId?: unknown, parentIds: unknown[] = []) {
  const Class = mongoose.model("Class");
  const Section = mongoose.model("Section");
  const User = mongoose.model("User");
  if (classId) {
    const cls = await Class.exists({ _id: classId, schoolId });
    if (!cls) throw new mongoose.Error.ValidatorError({ path: "classId", message: "Student class must belong to the same school" });
  }
  if (sectionId) {
    const filter: any = { _id: sectionId, schoolId };
    if (classId) filter.classId = classId;
    const section = await Section.exists(filter);
    if (!section) throw new mongoose.Error.ValidatorError({ path: "sectionId", message: "Student section must belong to the same school and selected class" });
  }
  if (parentIds.length) {
    const uniqueParentIds = [...new Set(parentIds.map((id) => id.toString()))];
    if (uniqueParentIds.length !== parentIds.length) throw new mongoose.Error.ValidatorError({ path: "parentIds", message: "Duplicate parent assignments are not allowed" });
    const parentCount = await User.countDocuments({ _id: { $in: parentIds }, schoolId, role: UserRole.PARENT, isActive: true });
    if (parentCount !== parentIds.length) throw new mongoose.Error.ValidatorError({ path: "parentIds", message: "Every assigned parent must be an active parent user in the same school" });
  }
}

StudentSchema.pre("validate", async function () {
  await validateStudentRelations(this.schoolId, this.classId, this.sectionId, this.parentIds);
});

StudentSchema.pre("findOneAndUpdate", async function () {
  const update: any = this.getUpdate() || {};
  const data = update.$set ? { ...update, ...update.$set } : update;
  const current: any = await this.model.findOne(this.getQuery()).select("schoolId classId sectionId parentIds").lean();
  if (!current) return;
  await validateStudentRelations(data.schoolId ?? current.schoolId, data.classId ?? current.classId, data.sectionId ?? current.sectionId, data.parentIds ?? current.parentIds ?? []);
});

StudentSchema.virtual("fullName").get(function () { return `${this.firstName} ${this.lastName}`; });
StudentSchema.set("toJSON", { virtuals: true });
StudentSchema.set("toObject", { virtuals: true });

export const Student = mongoose.model<IStudent>("Student", StudentSchema);
