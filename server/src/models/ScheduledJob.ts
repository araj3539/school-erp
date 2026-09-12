import { Schema, Types, model, Document } from "mongoose";
export type ScheduledJobStatus = "processing" | "succeeded" | "retrying" | "dead_letter";
export interface IScheduledJob extends Document { schoolId: Types.ObjectId; jobKey: string; scheduledFor: Date; status: ScheduledJobStatus; attempts: number; maxAttempts: number; lastError?: string; startedAt?: Date; completedAt?: Date; createdAt: Date; updatedAt: Date; }
const schema = new Schema<IScheduledJob>({ schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true }, jobKey: { type: String, required: true, trim: true, maxlength: 200 }, scheduledFor: { type: Date, required: true }, status: { type: String, enum: ["processing", "succeeded", "retrying", "dead_letter"], default: "processing" }, attempts: { type: Number, default: 0, min: 0 }, maxAttempts: { type: Number, default: 3, min: 1, max: 10 }, lastError: { type: String, maxlength: 2000 }, startedAt: Date, completedAt: Date }, { timestamps: true });
schema.index({ schoolId: 1, jobKey: 1 }, { unique: true }); schema.index({ schoolId: 1, status: 1, scheduledFor: 1 });
export const ScheduledJob = model<IScheduledJob>("ScheduledJob", schema);
