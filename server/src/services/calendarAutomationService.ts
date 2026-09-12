import { Types } from "mongoose";
import { AcademicCalendarEvent, Student } from "../models/index.js";
import { enqueueNotificationEvent } from "./notificationService.js";
import { runIdempotentJob } from "./scheduledJobService.js";

export async function runUpcomingCalendarNotifications(schoolId: Types.ObjectId, from = new Date(), horizonDays = 7): Promise<void> {
  const until = new Date(from.getTime() + horizonDays * 86_400_000);
  const events = await AcademicCalendarEvent.find({ schoolId, isActive: true, startDate: { $gte: from, $lte: until } }).lean();
  const students = await Student.find({ schoolId, status: "active" }).select("userId parentIds classId sectionId").lean();
  for (const event of events) {
    const recipients = students.filter((s: any) => event.appliesTo === "school" || (event.appliesTo === "class" && String(s.classId) === String(event.classId)) || (event.appliesTo === "section" && String(s.classId) === String(event.classId) && String(s.sectionId) === String(event.sectionId))).flatMap((s: any) => [s.userId, ...(s.parentIds ?? [])]).filter(Boolean).map((id: any) => new Types.ObjectId(id));
    await enqueueNotificationEvent({ schoolId, eventType: "calendar.upcoming", category: "announcement", priority: "normal", recipientIds: [...new Map(recipients.map((id) => [id.toString(), id])).values()], title: `Upcoming: ${event.title}`, message: `${event.title} is scheduled for ${event.startDate.toISOString().slice(0, 10)}.`, idempotencyKey: `calendar:${event._id.toString()}:${event.startDate.toISOString()}` });
  }
}

export async function runCalendarAutomation(schoolId: Types.ObjectId, runDate = new Date()) {
  return runIdempotentJob(schoolId, `calendar-upcoming:${runDate.toISOString().slice(0, 10)}`, async () => { await runUpcomingCalendarNotifications(schoolId, runDate); });
}
