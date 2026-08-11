import mongoose, { Document, Schema, Types } from "mongoose";

export interface ISubject extends Document {
  name: string;
  code: string;
  schoolId: Types.ObjectId;
  classIds: Types.ObjectId[];
  teacherId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>({
  name: { type: String, required: true, maxlength: 50 },
  code: { type: String, required: true, maxlength: 10 },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  classIds: [{ type: Schema.Types.ObjectId, ref: "Class" }],
  teacherId: { type: Schema.Types.ObjectId, ref: "Teacher" }
}, { timestamps: true });

SubjectSchema.index({ schoolId: 1, code: 1 }, { unique: true });
SubjectSchema.index({ schoolId: 1, classIds: 1 });

export const Subject = mongoose.model<ISubject>("Subject", SubjectSchema);