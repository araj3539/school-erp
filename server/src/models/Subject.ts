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

async function validateSubjectRelations(schoolId: unknown, classIds: unknown[] = [], teacherId?: unknown) {
  const Class = mongoose.model("Class");
  const Teacher = mongoose.model("Teacher");
  if (classIds.length) {
    const count = await Class.countDocuments({ _id: { $in: classIds }, schoolId });
    if (count !== classIds.length) throw new mongoose.Error.ValidatorError({ path: "classIds", message: "All subject classes must belong to the same school" });
  }
  if (teacherId) {
    const teacher = await Teacher.exists({ _id: teacherId, schoolId });
    if (!teacher) throw new mongoose.Error.ValidatorError({ path: "teacherId", message: "Subject teacher must belong to the same school" });
  }
}

SubjectSchema.pre("validate", async function () {
  await validateSubjectRelations(this.schoolId, this.classIds || [], this.teacherId);
});

SubjectSchema.pre("findOneAndUpdate", async function () {
  const update: any = this.getUpdate() || {};
  const data = update.$set ? { ...update, ...update.$set } : update;
  const current: any = await this.model.findOne(this.getQuery()).select("schoolId classIds teacherId").lean();
  if (!current) return;
  await validateSubjectRelations(data.schoolId ?? current.schoolId, data.classIds ?? current.classIds ?? [], data.teacherId ?? current.teacherId);
});

export const Subject = mongoose.model<ISubject>("Subject", SubjectSchema);