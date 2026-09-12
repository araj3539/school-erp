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
    name: { type: String, required: true, maxlength: 20, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isCurrent: { type: Boolean, default: false },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  },
  { timestamps: true },
);

AcademicYearSchema.pre("validate", function () {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    throw new mongoose.Error.ValidatorError({ path: "endDate", message: "Academic year end date must be after start date" });
  }
});

AcademicYearSchema.pre("findOneAndUpdate", async function () {
  const update: any = this.getUpdate() || {};
  const data = update.$set ? { ...update, ...update.$set } : update;
  const current: any = await this.model.findOne(this.getQuery()).select("startDate endDate").lean();
  if (!current) return;
  const startDate = data.startDate ?? current.startDate;
  const endDate = data.endDate ?? current.endDate;
  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    throw new mongoose.Error.ValidatorError({ path: "endDate", message: "Academic year end date must be after start date" });
  }
});

AcademicYearSchema.index(
  { schoolId: 1, isCurrent: 1 },
  { unique: true, partialFilterExpression: { isCurrent: true }, name: "schoolId_1_isCurrent_true_unique" },
);
AcademicYearSchema.index({ schoolId: 1, name: 1 }, { unique: true });
export const AcademicYear = mongoose.model<IAcademicYear>(
  "AcademicYear",
  AcademicYearSchema,
);
