import mongoose, { Document, Schema, Types } from "mongoose";
import { AttendanceStatus } from "@school-erp/shared";
import { Class } from "./Class.js";
import { Section } from "./Section.js";
import { Student } from "./Student.js";

export type AttendanceLifecycle = "OPEN" | "SUBMITTED" | "LOCKED" | "CORRECTION_REQUESTED" | "CORRECTED";
export interface IAttendanceRecord { studentId: Types.ObjectId; status: AttendanceStatus; remark?: string; }
export interface IAttendanceCorrection { requestedBy: Types.ObjectId; requestedAt: Date; reason: string; correctedBy?: Types.ObjectId; correctedAt?: Date; }
export interface IAttendance extends Document { date: Date; classId: Types.ObjectId; sectionId: Types.ObjectId; schoolId: Types.ObjectId; records: IAttendanceRecord[]; markedBy: Types.ObjectId; lifecycle: AttendanceLifecycle; lockedAt?: Date; lockedBy?: Types.ObjectId; corrections: IAttendanceCorrection[]; createdAt: Date; updatedAt: Date; }
const AttendanceRecordSchema = new Schema<IAttendanceRecord>({ studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true }, status: { type: String, enum: Object.values(AttendanceStatus), required: true }, remark: { type: String, maxlength: 200 } }, { _id: false });
const CorrectionSchema = new Schema<IAttendanceCorrection>({ requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, requestedAt: { type: Date, required: true }, reason: { type: String, required: true, trim: true, maxlength: 500 }, correctedBy: { type: Schema.Types.ObjectId, ref: "User" }, correctedAt: Date }, { _id: false });
const AttendanceSchema = new Schema<IAttendance>({ date: { type: Date, required: true }, classId: { type: Schema.Types.ObjectId, ref: "Class", required: true }, sectionId: { type: Schema.Types.ObjectId, ref: "Section", required: true }, schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true }, records: { type: [AttendanceRecordSchema], required: true }, markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, lifecycle: { type: String, enum: ["OPEN", "SUBMITTED", "LOCKED", "CORRECTION_REQUESTED", "CORRECTED"], default: "SUBMITTED", required: true }, lockedAt: Date, lockedBy: { type: Schema.Types.ObjectId, ref: "User" }, corrections: { type: [CorrectionSchema], default: [] } }, { timestamps: true });
async function validateAttendanceRelations(doc: IAttendance) {
  const schoolId = doc.schoolId;
  if (!await Class.exists({ _id: doc.classId, schoolId })) throw new Error("Attendance class must belong to the same school");
  if (!await Section.exists({ _id: doc.sectionId, schoolId, classId: doc.classId })) throw new Error("Attendance section must belong to the selected class and school");
  const studentIds = [...new Set(doc.records.map((record) => record.studentId.toString()))];
  if (studentIds.length !== doc.records.length) throw new Error("Attendance records cannot contain duplicate students");
  const students = await Student.countDocuments({ _id: { $in: studentIds }, schoolId, classId: doc.classId, sectionId: doc.sectionId });
  if (students !== studentIds.length) throw new Error("Every attendance student must belong to the selected class, section, and school");
  if (doc.lifecycle === "LOCKED" && !doc.lockedAt) throw new Error("Locked attendance must have a lock timestamp");
}
AttendanceSchema.pre("validate", async function () { await validateAttendanceRelations(this); });
AttendanceSchema.pre("save", function (next) { if (!this.isNew && this.get("lifecycle") === "LOCKED" && this.isModified("records")) return next(new Error("Locked attendance cannot be edited without an approved correction")); next(); });
AttendanceSchema.index({ schoolId: 1, date: 1, classId: 1, sectionId: 1 }, { unique: true });
AttendanceSchema.index({ schoolId: 1, date: 1 });
AttendanceSchema.index({ "records.studentId": 1, date: 1 });
AttendanceSchema.index({ schoolId: 1, lifecycle: 1, date: -1 });
export const Attendance = mongoose.model<IAttendance>("Attendance", AttendanceSchema);
