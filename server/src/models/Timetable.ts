import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITimetable extends Document {
  schoolId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId?: Types.ObjectId;
  subjectId: Types.ObjectId;
  teacherId: Types.ObjectId;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  roomNumber?: string;
  periodLabel?: string;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TimetableSchema = new Schema<ITimetable>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true },
  classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
  sectionId: { type: Schema.Types.ObjectId, ref: "Section" },
  subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
  dayOfWeek: { type: Number, required: true, min: 1, max: 7 },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  roomNumber: { type: String, trim: true, maxlength: 50 },
  periodLabel: { type: String, trim: true, maxlength: 50 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

TimetableSchema.index({ schoolId: 1, academicYearId: 1, dayOfWeek: 1, startTime: 1 });
TimetableSchema.index({ schoolId: 1, teacherId: 1, academicYearId: 1, dayOfWeek: 1 });
TimetableSchema.index({ schoolId: 1, classId: 1, sectionId: 1, academicYearId: 1, dayOfWeek: 1 });
TimetableSchema.index({ schoolId: 1, roomNumber: 1, academicYearId: 1, dayOfWeek: 1 });

export const Timetable = mongoose.model<ITimetable>("Timetable", TimetableSchema);
