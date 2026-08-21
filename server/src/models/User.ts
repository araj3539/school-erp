import mongoose, { Document, Schema, Types } from "mongoose";
import { UserRole } from "@school-erp/shared";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: UserRole;
  profileId?: Types.ObjectId;
  schoolId?: Types.ObjectId;
  isActive: boolean;
  refreshTokenVersion: number;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: Object.values(UserRole), required: true },
  profileId: { type: Schema.Types.ObjectId, refPath: "role" },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: false },
  isActive: { type: Boolean, default: true },
  refreshTokenVersion: { type: Number, default: 0 },
  lastLogin: { type: Date }
}, { timestamps: true });

UserSchema.pre("validate", function (next) {
  if (this.role === UserRole.SUPER_ADMIN) {
    this.schoolId = undefined;
  } else if (!this.schoolId) {
    this.invalidate("schoolId", "School is required for non-super-admin users");
  }
  next();
});

UserSchema.index({ email: 1, schoolId: 1 }, { unique: true });
UserSchema.index({ schoolId: 1, role: 1 });

export const User = mongoose.model<IUser>("User", UserSchema);
