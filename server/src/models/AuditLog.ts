import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAuditLog extends Document {
  schoolId: Types.ObjectId;
  userId: Types.ObjectId;
  action: string;
  entity: string;
  entityId: Types.ObjectId;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId, required: true },
  before: { type: Schema.Types.Mixed },
  after: { type: Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String }
}, { timestamps: { createdAt: true, updatedAt: false } });

AuditLogSchema.index({ schoolId: 1, createdAt: -1 });
AuditLogSchema.index({ schoolId: 1, userId: 1, createdAt: -1 });
AuditLogSchema.index({ schoolId: 1, entity: 1, entityId: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
