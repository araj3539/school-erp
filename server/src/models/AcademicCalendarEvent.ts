import mongoose, { Document, Schema, Types } from "mongoose";

export type AcademicCalendarEventType = "holiday" | "working_day" | "exam" | "event" | "closure";

export interface IAcademicCalendarEvent extends Document {
  schoolId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  title: string;
  type: AcademicCalendarEventType;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  description?: string;
  appliesTo: "school" | "class" | "section";
  classId?: Types.ObjectId;
  sectionId?: Types.ObjectId;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IAcademicCalendarEvent>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  type: { type: String, enum: ["holiday", "working_day", "exam", "event", "closure"], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  allDay: { type: Boolean, default: true },
  description: { type: String, maxlength: 1000 },
  appliesTo: { type: String, enum: ["school", "class", "section"], default: "school" },
  classId: { type: Schema.Types.ObjectId, ref: "Class" },
  sectionId: { type: Schema.Types.ObjectId, ref: "Section" },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

schema.pre("validate", function () {
  if (this.endDate < this.startDate) throw new Error("Calendar event end date must be on or after start date");
  if (this.appliesTo === "school" && (this.classId || this.sectionId)) throw new Error("School-wide events cannot specify class or section");
  if (this.appliesTo === "class" && !this.classId) throw new Error("Class events require a class");
  if (this.appliesTo === "section" && (!this.classId || !this.sectionId)) throw new Error("Section events require class and section");
});

schema.index({ schoolId: 1, academicYearId: 1, startDate: 1, endDate: 1 });
schema.index({ schoolId: 1, type: 1, startDate: 1 });

export const AcademicCalendarEvent = mongoose.model<IAcademicCalendarEvent>("AcademicCalendarEvent", schema);
