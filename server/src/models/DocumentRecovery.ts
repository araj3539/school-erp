import mongoose, { Document, Schema, Types } from "mongoose";

export type DocumentRecoverySource = "r2-deletion" | "manual-archive";
export type DocumentRecoveryStatus = "available" | "restored" | "expired";

export interface IDocumentRecovery extends Document {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  documentType: string;
  storageKey: string;
  recoveryKey: string;
  originalName?: string;
  mimeType?: string;
  sizeBytes?: number;
  deletedAt: Date;
  expiresAt: Date;
  source: DocumentRecoverySource;
  status: DocumentRecoveryStatus;
  restoredAt?: Date;
  restoredBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentRecoverySchema = new Schema<IDocumentRecovery>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
  documentType: { type: String, required: true, maxlength: 100 },
  storageKey: { type: String, required: true, maxlength: 1024 },
  recoveryKey: { type: String, required: true, unique: true, maxlength: 1200 },
  originalName: { type: String, maxlength: 255 },
  mimeType: { type: String, maxlength: 100 },
  sizeBytes: { type: Number, min: 0 },
  deletedAt: { type: Date, required: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
  source: { type: String, enum: ["r2-deletion", "manual-archive"], required: true, default: "r2-deletion" },
  status: { type: String, enum: ["available", "restored", "expired"], required: true, default: "available", index: true },
  restoredAt: { type: Date },
  restoredBy: { type: Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

DocumentRecoverySchema.index({ schoolId: 1, studentId: 1, documentType: 1, status: 1, deletedAt: -1 });
DocumentRecoverySchema.index({ expiresAt: 1, status: 1 });
// MongoDB TTL monitor removes the metadata after the recovery window. B2 objects are independently cleaned by the backup workflow.
DocumentRecoverySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const DocumentRecovery = mongoose.model<IDocumentRecovery>("DocumentRecovery", DocumentRecoverySchema);
