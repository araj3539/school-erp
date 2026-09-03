import mongoose, { Document, Schema, Types } from "mongoose";
export interface IMark { subjectId: Types.ObjectId; value: number; absent: boolean; }
export interface IExamResult extends Document { schoolId: Types.ObjectId; examId: Types.ObjectId; studentId: Types.ObjectId; classId: Types.ObjectId; sectionId?: Types.ObjectId; academicYearId: Types.ObjectId; marks: IMark[]; totalMarks: number; obtainedMarks: number; percentage: number; grade: string; result: "pass" | "fail"; status: "draft" | "published"; publishedAt?: Date; publishedBy?: Types.ObjectId; createdAt: Date; updatedAt: Date; }
const ExamResultSchema = new Schema<IExamResult>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true }, examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true }, studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true }, classId: { type: Schema.Types.ObjectId, ref: "Class", required: true }, sectionId: { type: Schema.Types.ObjectId, ref: "Section" }, academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true },
  marks: [{ subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true }, value: { type: Number, required: true, min: 0 }, absent: { type: Boolean, default: false } }],
  totalMarks: { type: Number, required: true, min: 0 }, obtainedMarks: { type: Number, required: true, min: 0 }, percentage: { type: Number, required: true, min: 0, max: 100 }, grade: { type: String, required: true, maxlength: 5 }, result: { type: String, enum: ["pass", "fail"], required: true }, status: { type: String, enum: ["draft", "published"], default: "draft" }, publishedAt: Date, publishedBy: { type: Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
ExamResultSchema.index({ schoolId: 1, examId: 1, studentId: 1 }, { unique: true });
ExamResultSchema.index({ schoolId: 1, examId: 1, status: 1, classId: 1 });
export const ExamResult = mongoose.model<IExamResult>("ExamResult", ExamResultSchema);
