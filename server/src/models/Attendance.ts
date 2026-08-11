import mongoose, { Document, Schema, Types } from "mongoose";
import { AttendanceStatus } from "@school-erp/shared";

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

AttendanceSchema.index({ date: 1, classId: 1, sectionId: 1 }, { unique: true });
AttendanceSchema.index({ schoolId: 1, date: 1 });
AttendanceSchema.index({ "records.studentId": 1, date: 1 });

export const Attendance = mongoose.model<IAttendance>("Attendance", AttendanceSchema);