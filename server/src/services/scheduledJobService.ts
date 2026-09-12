import { ScheduledJob } from "../models/ScheduledJob.js";
import { Types } from "mongoose";

export async function runIdempotentJob(schoolId: string | Types.ObjectId, jobKey: string, task: () => Promise<void>, maxAttempts = 3) {
  const claimed = await ScheduledJob.findOneAndUpdate(
    { schoolId, jobKey },
    { $setOnInsert: { schoolId, jobKey, scheduledFor: new Date(), status: "processing", attempts: 0, maxAttempts }, $set: { startedAt: new Date() }, $inc: { attempts: 1 } },
    { upsert: true, new: true },
  );
  if (claimed.status === "succeeded" || claimed.status === "dead_letter") return { status: claimed.status, skipped: true };
  try {
    await task();
    await ScheduledJob.updateOne({ _id: claimed._id }, { $set: { status: "succeeded", completedAt: new Date() } });
    return { status: "succeeded", skipped: false };
  } catch (error) {
    const attempts = claimed.attempts;
    await ScheduledJob.updateOne({ _id: claimed._id }, { $set: { status: attempts >= maxAttempts ? "dead_letter" : "retrying", lastError: error instanceof Error ? error.message : String(error) } });
    throw error;
  }
}

export async function getJobHistory(schoolId: string | Types.ObjectId, limit = 100) {
  return ScheduledJob.find({ schoolId }).sort({ createdAt: -1 }).limit(Math.min(Math.max(limit, 1), 100)).lean();
}
