import mongoose, { Document, Schema, Types } from "mongoose";
import { StudentStatus } from "@school-erp/shared";

export interface IStudentLifecycleEvent extends Document {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  fromStatus?: StudentStatus;
  toStatus: StudentStatus;
  reason?: string;
  effectiveAt: Date;
  actorId: Types.ObjectId;
  classId?: Types.ObjectId;
  sectionId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const StudentLifecycleEventSchema = new Schema<IStudentLifecycleEvent>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
  fromStatus: { type: String, enum: Object.values(StudentStatus) },
  toStatus: { type: String, enum: Object.values(StudentStatus), required: true },
  reason: { type: String, trim: true, maxlength: 1000 },
  effectiveAt: { type: Date, required: true },
  actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  classId: { type: Schema.Types.ObjectId, ref: "Class" },
  sectionId: { type: Schema.Types.ObjectId, ref: "Section" },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

StudentLifecycleEventSchema.index({ schoolId: 1, studentId: 1, effectiveAt: -1, createdAt: -1 });
StudentLifecycleEventSchema.index({ schoolId: 1, toStatus: 1, effectiveAt: -1 });

export const StudentLifecycleEvent = mongoose.model<IStudentLifecycleEvent>("StudentLifecycleEvent", StudentLifecycleEventSchema);
