import mongoose, { Document, Schema, Types } from "mongoose";

export type ResultTemplateType = "report_card" | "mark_sheet" | "transcript" | "progress_report";

export interface IResultTemplateLayout {
  groupBySubject?: boolean;
  showHeader?: boolean;
  showStudentInfo?: boolean;
  showRank?: boolean;
  showPercentage?: boolean;
  showGrade?: boolean;
  showRemarks?: boolean;
  showAttendance?: boolean;
  subjectColumns?: string[];
  footerText?: string;
}

export interface IResultTemplateBranding {
  logoUrl?: string;
  headerText?: string;
  footerText?: string;
  primaryColor?: string;
  schoolName?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
}

export interface ISignatureField {
  label: string;
  role: "principal" | "teacher" | "accountant" | "class_teacher";
}

export interface IResultTemplate extends Document {
  schoolId: Types.ObjectId;
  name: string;
  description?: string;
  type: ResultTemplateType;
  layout: IResultTemplateLayout;
  branding: IResultTemplateBranding;
  gradingScale?: Types.ObjectId;
  signatureFields: ISignatureField[];
  isDefault: boolean;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ResultTemplateSchema = new Schema<IResultTemplate>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500 },
  type: { type: String, enum: ["report_card", "mark_sheet", "transcript", "progress_report"], required: true },
  layout: {
    type: Schema.Types.Mixed,
    default: {
      groupBySubject: true,
      showHeader: true,
      showStudentInfo: true,
      showRank: false,
      showPercentage: true,
      showGrade: true,
      showRemarks: false,
      showAttendance: false,
      subjectColumns: ["subject", "maxMarks", "obtainedMarks", "grade"],
      footerText: "",
    },
  },
  branding: {
    type: Schema.Types.Mixed,
    default: {},
  },
  gradingScale: { type: Schema.Types.ObjectId, ref: "Exam", default: undefined },
  signatureFields: [{
    label: { type: String, required: true, trim: true, maxlength: 50 },
    role: { type: String, enum: ["principal", "teacher", "accountant", "class_teacher"], required: true },
  }],
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

ResultTemplateSchema.index({ schoolId: 1, name: 1 }, { unique: true });
ResultTemplateSchema.index({ schoolId: 1, isDefault: 1 });
ResultTemplateSchema.index({ schoolId: 1, isActive: 1 });

ResultTemplateSchema.pre("validate", async function (next) {
  if (this.isDefault) {
    const existing = await mongoose.model<IResultTemplate>("ResultTemplate").findOne({
      schoolId: this.schoolId,
      isDefault: true,
      _id: { $ne: this._id },
    }).lean();
    if (existing) {
      return next(new mongoose.Error.ValidatorError({
        path: "isDefault",
        message: "A default result template already exists for this school",
      }));
    }
  }
  next();
});

export const ResultTemplate = mongoose.model<IResultTemplate>("ResultTemplate", ResultTemplateSchema);
