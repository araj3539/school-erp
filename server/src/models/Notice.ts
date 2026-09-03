import { Document, Schema, Types, model } from "mongoose";

export type NoticePriority = "low" | "normal" | "high" | "urgent";
export type NoticeAudience = "school" | "class" | "section";

export interface INotice extends Document {
  schoolId: Types.ObjectId;
  title: string;
  message: string;
  priority: NoticePriority;
  audience: NoticeAudience;
  classId?: Types.ObjectId;
  sectionId?: Types.ObjectId;
  publishAt: Date;
  expiresAt?: Date;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema = new Schema<INotice>({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 10000 },
  priority: { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal", required: true },
  audience: { type: String, enum: ["school", "class", "section"], default: "school", required: true },
  classId: { type: Schema.Types.ObjectId, ref: "Class" },
  sectionId: { type: Schema.Types.ObjectId, ref: "Section" },
  publishAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

NoticeSchema.index({ schoolId: 1, publishAt: -1, expiresAt: 1 });
NoticeSchema.index({ schoolId: 1, classId: 1, sectionId: 1, publishAt: -1 });

NoticeSchema.pre("validate", function(next) {
  if (this.expiresAt && this.expiresAt <= this.publishAt) return next(new Error("Expiry must be after publication time"));
  if (this.audience === "school" && (this.classId || this.sectionId)) return next(new Error("School notices cannot target a class or section"));
  if (this.audience === "class" && (!this.classId || this.sectionId)) return next(new Error("Class notices require a class and cannot target a section"));
  if (this.audience === "section" && (!this.classId || !this.sectionId)) return next(new Error("Section notices require a class and section"));
  next();
});

export const Notice = model<INotice>("Notice", NoticeSchema);
