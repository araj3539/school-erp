import { Types } from "mongoose";
import { ScheduledJob } from "../models/ScheduledJob.js";

export async function runIdempotentJob(schoolId: string | Types.ObjectId, jobKey: string, task: () => Promise<void>, maxAttempts = 3) {
  const now = new Date();
  let claimed = await ScheduledJob.findOneAndUpdate(
    { schoolId, jobKey, status: { $in: ["retrying", "processing"] } },
    { $set: { status: "processing", startedAt: now }, $inc: { attempts: 1 } },
    { new: true },
  );

  if (!claimed) {
    try {
      claimed = await ScheduledJob.create({ schoolId, jobKey, scheduledFor: now, status: "processing", attempts: 1, maxAttempts, startedAt: now });
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      claimed = await ScheduledJob.findOne({ schoolId, jobKey });
      if (!claimed || claimed.status === "succeeded" || claimed.status === "dead_letter" || claimed.status === "processing") {
        return { status: claimed?.status ?? "processing", skipped: true };
      }
      claimed = await ScheduledJob.findOneAndUpdate(
        { _id: claimed._id, status: "retrying" },
        { $set: { status: "processing", startedAt: now }, $inc: { attempts: 1 } },
        { new: true },
      );
      if (!claimed) return { status: "processing", skipped: true };
    }
  }

  if (claimed.status === "succeeded" || claimed.status === "dead_letter") return { status: claimed.status, skipped: true };
  try {
    await task();
    await ScheduledJob.updateOne({ _id: claimed._id, status: "processing" }, { $set: { status: "succeeded", completedAt: new Date(), lastError: undefined } });
    return { status: "succeeded", skipped: false };
  } catch (error) {
    const attempts = claimed.attempts;
    await ScheduledJob.updateOne(
      { _id: claimed._id, status: "processing" },
      { $set: { status: attempts >= maxAttempts ? "dead_letter" : "retrying", lastError: error instanceof Error ? error.message : String(error) } },
    );
    throw error;
  }
}

export async function getJobHistory(schoolId: string | Types.ObjectId, limit = 100) {
  return ScheduledJob.find({ schoolId }).sort({ createdAt: -1 }).limit(Math.min(Math.max(limit, 1), 100)).lean();
}
