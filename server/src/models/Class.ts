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

export const Class = mongoose.model<IClass>("Class", ClassSchema);