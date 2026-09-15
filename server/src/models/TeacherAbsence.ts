import mongoose, { Document, Schema, Types } from "mongoose";

export type TeacherAbsenceStatus = "reported" | "partially_assigned" | "assigned" | "cancelled";

export interface ITeacherAbsence extends Document {
  schoolId: Types.ObjectId;
  teacherId: Types.ObjectId;
  date: string;
  reason?: string;
  status: TeacherAbsenceStatus;
  affectedTimetableIds: Types.ObjectId[];
  assignments: Array<{
    timetableId: Types.ObjectId;
    substituteTeacherId: Types.ObjectId;
    assignedBy: Types.ObjectId;
    assignedAt: Date;
  }>;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema({
  timetableId: { type: Schema.Types.ObjectId, ref: "Timetable", required: true },
  substituteTeacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
  assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  assignedAt: { type: Date, default: Date.now, required: true },
}, { _id: false });

const TeacherAbsenceSchema = new Schema<ITeacherAbsence>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  reason: { type: String, trim: true, maxlength: 500 },
  status: { type: String, enum: ["reported", "partially_assigned", "assigned", "cancelled"], default: "reported" },
  affectedTimetableIds: { type: [Schema.Types.ObjectId], ref: "Timetable", default: [] },
  assignments: { type: [AssignmentSchema], default: [] },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

TeacherAbsenceSchema.index({ schoolId: 1, teacherId: 1, date: 1 }, { unique: true });
TeacherAbsenceSchema.index({ schoolId: 1, date: 1, status: 1 });

export const TeacherAbsence = mongoose.model<ITeacherAbsence>("TeacherAbsence", TeacherAbsenceSchema);
