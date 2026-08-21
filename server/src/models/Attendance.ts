import mongoose, { Document, Schema, Types } from "mongoose";
import { AttendanceStatus } from "@school-erp/shared";
import { Class } from "./Class.js";
import { Section } from "./Section.js";
import { Student } from "./Student.js";

export interface IAttendanceRecord {
  studentId: Types.ObjectId;
  status: AttendanceStatus;
  remark?: string;
}

export interface IAttendance extends Document {
  date: Date;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  schoolId: Types.ObjectId;
  records: IAttendanceRecord[];
  markedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>({
  studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  status: { type: String, enum: Object.values(AttendanceStatus), required: true },
  remark: { type: String, maxlength: 200 }
});

const AttendanceSchema = new Schema<IAttendance>({
  date: { type: Date, required: true },
  classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
  sectionId: { type: Schema.Types.ObjectId, ref: "Section", required: true },
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  records: { type: [AttendanceRecordSchema], required: true },
  markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

async function validateAttendanceRelations(doc: IAttendance) {
  const schoolId = doc.schoolId;
  const classDoc = await Class.exists({ _id: doc.classId, schoolId });
  if (!classDoc) throw new Error("Attendance class must belong to the same school");

  const sectionDoc = await Section.exists({ _id: doc.sectionId, schoolId, classId: doc.classId });
  if (!sectionDoc) throw new Error("Attendance section must belong to the selected class and school");

  const studentIds = [...new Set(doc.records.map((record) => record.studentId.toString()))];
  if (studentIds.length !== doc.records.length) throw new Error("Attendance records cannot contain duplicate students");
  const students = await Student.countDocuments({ _id: { $in: studentIds }, schoolId, classId: doc.classId, sectionId: doc.sectionId });
  if (students !== studentIds.length) throw new Error("Every attendance student must belong to the selected class, section, and school");
}

AttendanceSchema.pre("validate", async function () {
  await validateAttendanceRelations(this);
});

AttendanceSchema.index({ schoolId: 1, date: 1, classId: 1, sectionId: 1 }, { unique: true });
AttendanceSchema.index({ schoolId: 1, date: 1 });
AttendanceSchema.index({ "records.studentId": 1, date: 1 });

export const Attendance = mongoose.model<IAttendance>("Attendance", AttendanceSchema);
