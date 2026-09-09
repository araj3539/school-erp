import mongoose, { Document, Schema, Types } from "mongoose";

export interface IModuleEntitlement extends Document {
  schoolId: Types.ObjectId;
  moduleId: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ModuleEntitlementSchema = new Schema<IModuleEntitlement>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, immutable: true },
  moduleId: { type: String, required: true, immutable: true, trim: true, lowercase: true, maxlength: 64 },
  enabled: { type: Boolean, required: true },
}, { timestamps: true });

ModuleEntitlementSchema.index({ schoolId: 1, moduleId: 1 }, { unique: true, name: "schoolId_1_moduleId_1" });
ModuleEntitlementSchema.index({ schoolId: 1, enabled: 1 }, { name: "schoolId_1_enabled_1" });

export const ModuleEntitlement = mongoose.model<IModuleEntitlement>("ModuleEntitlement", ModuleEntitlementSchema);
