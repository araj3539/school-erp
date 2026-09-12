import mongoose, { Document, Schema, Types } from "mongoose";

export type FeeHeadKind = "one_time" | "recurring" | "optional";

export interface IFeeHead extends Document {
  schoolId: Types.ObjectId;
  name: string;
  code: string;
  kind: FeeHeadKind;
  description?: string;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FeeHeadSchema = new Schema<IFeeHead>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  code: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
  kind: { type: String, enum: ["one_time", "recurring", "optional"], default: "recurring" },
  description: { type: String, trim: true, maxlength: 500 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

FeeHeadSchema.index({ schoolId: 1, code: 1 }, { unique: true });
FeeHeadSchema.index({ schoolId: 1, isActive: 1, name: 1 });

export const FeeHead = mongoose.model<IFeeHead>("FeeHead", FeeHeadSchema);
