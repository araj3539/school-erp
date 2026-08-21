import mongoose, { Document, Schema, Types } from "mongoose";

export interface IClass extends Document {
  name: string;
  displayName: string;
  schoolId: Types.ObjectId;
  sectionIds: Types.ObjectId[];
  classTeacherId?: Types.ObjectId;
  roomNumber?: string;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>({
  name: { type: String, required: true, maxlength: 10 },
  displayName: { type: String, required: true, maxlength: 50 },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  sectionIds: [{ type: Schema.Types.ObjectId, ref: "Section" }],
  classTeacherId: { type: Schema.Types.ObjectId, ref: "Teacher" },
  roomNumber: { type: String, maxlength: 20 },
  capacity: { type: Number, default: 40, min: 1 }
}, { timestamps: true });

ClassSchema.index({ schoolId: 1, name: 1 }, { unique: true });

async function validateClassTeacher(schoolId: unknown, teacherId?: unknown) {
  if (!teacherId) return;
  const Teacher = mongoose.model("Teacher");
  const teacher = await Teacher.exists({ _id: teacherId, schoolId });
  if (!teacher) throw new mongoose.Error.ValidatorError({ path: "classTeacherId", message: "Class teacher must belong to the same school" });
}

ClassSchema.pre("validate", async function () {
  await validateClassTeacher(this.schoolId, this.classTeacherId);
});

ClassSchema.pre("findOneAndUpdate", async function () {
  const update: any = this.getUpdate() || {};
  const data = update.$set ? { ...update, ...update.$set } : update;
  const current: any = await this.model.findOne(this.getQuery()).select("schoolId classTeacherId").lean();
  if (!current) return;
  await validateClassTeacher(data.schoolId ?? current.schoolId, data.classTeacherId ?? current.classTeacherId);
});

export const Class = mongoose.model<IClass>("Class", ClassSchema);