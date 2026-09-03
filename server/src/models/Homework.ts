import { Document, Schema, Types, model } from "mongoose";

export interface IHomeworkAttachment { name: string; url: string; size?: number; mimeType?: string; }
export interface IHomework extends Document {
  schoolId: Types.ObjectId;
  title: string;
  description?: string;
  classId: Types.ObjectId;
  sectionId?: Types.ObjectId;
  subjectId: Types.ObjectId;
  academicYearId: Types.ObjectId;
  assignedDate: string;
  dueDate: string;
  attachments: IHomeworkAttachment[];
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const HomeworkSchema = new Schema<IHomework>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, trim: true, maxlength: 5000 },
  classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
  sectionId: { type: Schema.Types.ObjectId, ref: "Section" },
  subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true },
  assignedDate: { type: String, required: true },
  dueDate: { type: String, required: true },
  attachments: [{
    name: { type: String, required: true, trim: true, maxlength: 200 },
    url: { type: String, required: true, maxlength: 2000 },
    size: { type: Number, min: 0 },
    mimeType: { type: String, trim: true, maxlength: 100 },
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

HomeworkSchema.index({ schoolId: 1, academicYearId: 1, classId: 1, sectionId: 1, assignedDate: -1 });
HomeworkSchema.index({ schoolId: 1, subjectId: 1, dueDate: 1 });
HomeworkSchema.pre("validate", function(next) {
  if (this.assignedDate > this.dueDate) return next(new Error("Due date must be on or after assigned date"));
  next();
});

export const Homework = model<IHomework>("Homework", HomeworkSchema);
