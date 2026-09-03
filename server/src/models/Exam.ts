import mongoose, { Document, Schema, Types } from "mongoose";

export interface IExamSubject { subjectId: Types.ObjectId; maxMarks: number; passMarks: number; }
export interface IGradeRule { grade: string; minPercentage: number; maxPercentage: number; remark?: string; }
export interface IExam extends Document { schoolId: Types.ObjectId; name: string; examType: string; academicYearId: Types.ObjectId; classId: Types.ObjectId; startDate: string; endDate: string; subjects: IExamSubject[]; gradeRules: IGradeRule[]; status: "draft" | "published"; publishedAt?: Date; publishedBy?: Types.ObjectId; createdAt: Date; updatedAt: Date; }

const ExamSchema = new Schema<IExam>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  examType: { type: String, required: true, trim: true, maxlength: 50 },
  academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true },
  classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  subjects: [{ subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true }, maxMarks: { type: Number, required: true, min: 0.01 }, passMarks: { type: Number, required: true, min: 0 } }],
  gradeRules: [{ grade: { type: String, required: true, trim: true, maxlength: 5 }, minPercentage: { type: Number, required: true, min: 0, max: 100 }, maxPercentage: { type: Number, required: true, min: 0, max: 100 }, remark: { type: String, maxlength: 100 } }],
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  publishedAt: Date,
  publishedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
ExamSchema.index({ schoolId: 1, academicYearId: 1, classId: 1, name: 1 }, { unique: true });
ExamSchema.index({ schoolId: 1, status: 1, startDate: -1 });
ExamSchema.pre("validate", function(next) { if (this.startDate > this.endDate) return next(new mongoose.Error.ValidatorError({ path: "endDate", message: "End date must be on or after start date" })); for (const s of this.subjects) if (s.passMarks > s.maxMarks) return next(new mongoose.Error.ValidatorError({ path: "subjects", message: "Pass marks cannot exceed max marks" })); const rules = [...this.gradeRules].sort((a,b)=>a.minPercentage-b.minPercentage); for(let i=1;i<rules.length;i++) if(rules[i].minPercentage <= rules[i-1].maxPercentage) return next(new mongoose.Error.ValidatorError({ path: "gradeRules", message: "Grade ranges must not overlap" })); next(); });
export const Exam = mongoose.model<IExam>("Exam", ExamSchema);
