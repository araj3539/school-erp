import mongoose, { Document, Schema, Types } from "mongoose";
export interface IAcademicYear extends Document {
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  schoolId: Types.ObjectId;
  createdAt: Date;
}
const AcademicYearSchema = new Schema<IAcademicYear>(
  {
    name: { type: String, required: true, maxlength: 20 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isCurrent: { type: Boolean, default: false },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  },
  { timestamps: true },
);
AcademicYearSchema.index({ schoolId: 1, isCurrent: 1 });
AcademicYearSchema.index({ schoolId: 1, name: 1 }, { unique: true });
export const AcademicYear = mongoose.model<IAcademicYear>(
  "AcademicYear",
  AcademicYearSchema,
);
