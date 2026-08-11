import mongoose, { Document, Schema, Types } from "mongoose";

export interface ISection extends Document {
  name: string;
  classId: Types.ObjectId;
  schoolId: Types.ObjectId;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

const SectionSchema = new Schema<ISection>({
  name: { type: String, required: true, maxlength: 10 },
  classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  capacity: { type: Number, default: 40, min: 1 }
}, { timestamps: true });

SectionSchema.index({ classId: 1, name: 1 }, { unique: true });
SectionSchema.index({ schoolId: 1 });

export const Section = mongoose.model<ISection>("Section", SectionSchema);