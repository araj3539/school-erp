import mongoose, { Document, Schema, Types } from "mongoose";

export type FeePolicyApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";
export interface IFeePolicyApproval extends Document {
  schoolId: Types.ObjectId; feeStructureId: Types.ObjectId; proposedChanges: Record<string, unknown>; requestedBy: Types.ObjectId; reviewedBy?: Types.ObjectId; status: FeePolicyApprovalStatus; reviewReason?: string; requestedAt: Date; reviewedAt?: Date;
}
const schema = new Schema<IFeePolicyApproval>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true }, feeStructureId: { type: Schema.Types.ObjectId, ref: "FeeStructure", required: true }, proposedChanges: { type: Schema.Types.Mixed, required: true }, requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, reviewedBy: { type: Schema.Types.ObjectId, ref: "User" }, status: { type: String, enum: ["pending", "approved", "rejected", "cancelled"], default: "pending", index: true }, reviewReason: { type: String, trim: true, maxlength: 500 }, requestedAt: { type: Date, default: Date.now }, reviewedAt: { type: Date },
});
schema.index({ schoolId: 1, status: 1, requestedAt: -1 }); schema.index({ schoolId: 1, feeStructureId: 1, status: 1 });
export const FeePolicyApproval = mongoose.model<IFeePolicyApproval>("FeePolicyApproval", schema);
