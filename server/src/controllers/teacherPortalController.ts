import { Request, Response, NextFunction } from "express";
import { Attendance, AcademicYear, Class, Section, Student, Teacher, Timetable, Homework, Notification } from "../models/index.js";
import { UserRole } from "@school-erp/shared";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";
import { parseCalendarDate, addCalendarDays } from "../utils/calendarDate.js";

function getDayOfWeek(date: Date) {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

export async function getTeacherWorkspace(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user!.role !== UserRole.TEACHER) throw AppError.forbidden("Teacher workspace is not available for this role");

    const schoolId = getTenantId(req);
    const teacher = await Teacher.findOne({ userId: req.user!.userId, schoolId, status: "active" })
      .select("_id firstName lastName subjects classTeacherOf")
      .lean();
    if (!teacher) throw AppError.forbidden("Teacher profile not found");

    const academicYear = await AcademicYear.findOne({ schoolId, isCurrent: true })
      .select("_id name startDate endDate")
      .lean();
    if (!academicYear) throw AppError.badRequest("No current academic year set");

    const requestedDate = typeof req.query.date === "string" ? req.query.date : undefined;
    const date = requestedDate ? parseCalendarDate(requestedDate) : parseCalendarDate(new Date().toISOString().slice(0, 10));
    if (date < new Date(academicYear.startDate) || date >= new Date(academicYear.endDate)) {
      throw AppError.badRequest("Selected date must fall within the current academic year");
    }

    const classIds = teacher.classTeacherOf ?? [];
    const subjectIds = teacher.subjects ?? [];
    const dayStart = date;
    const dayEnd = addCalendarDays(date, 1);

    const [classes, timetable, attendance, homework, notifications] = await Promise.all([
      classIds.length
        ? Class.find({ _id: { $in: classIds }, schoolId }).select("_id displayName name sectionIds classTeacherId roomNumber").sort({ name: 1 }).lean()
        : [],
      Timetable.find({ schoolId, academicYearId: academicYear._id, teacherId: teacher._id, dayOfWeek: getDayOfWeek(date) })
        .populate("classId sectionId subjectId")
        .sort({ startTime: 1 })
        .limit(20)
        .lean(),
      classIds.length
        ? Attendance.find({ schoolId, date: { $gte: date, $lt: dayEnd }, classId: { $in: classIds } })
            .select("_id date classId sectionId records markedBy")
            .populate("classId sectionId")
            .sort({ classId: 1, sectionId: 1 })
            .limit(50)
            .lean()
        : [],
      subjectIds.length || classIds.length
        ? Homework.find({
            schoolId,
            academicYearId: academicYear._id,
            $or: [
              ...(classIds.length ? [{ classId: { $in: classIds } }] : []),
              ...(subjectIds.length ? [{ subjectId: { $in: subjectIds } }] : []),
            ],
            dueDate: { $gte: dayStart, $lt: addCalendarDays(date, 8) },
          })
            .populate("classId sectionId subjectId")
            .select("_id title description assignedDate dueDate classId sectionId subjectId status")
            .sort({ dueDate: 1, assignedDate: -1 })
            .limit(12)
            .lean()
        : [],
      Notification.find({ schoolId, recipientId: req.user!.userId })
        .select("_id title message category priority readAt createdAt actionUrl")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

    const sectionIds = classes.flatMap((item) => item.sectionIds ?? []);
    const [sections, students] = await Promise.all([
      sectionIds.length
        ? Section.find({ _id: { $in: sectionIds }, schoolId }).select("_id name classId capacity").sort({ classId: 1, name: 1 }).lean()
        : [],
      classIds.length
        ? Student.find({ schoolId, classId: { $in: classIds }, status: "active" })
            .select("_id admissionNo firstName lastName classId sectionId")
            .sort({ firstName: 1, lastName: 1 })
            .limit(500)
            .lean()
        : [],
    ]);

    const currentMinutes = new Date().getUTCHours() * 60 + new Date().getUTCMinutes();
    const periodWithState = timetable.map((period: any) => {
      const [startHour, startMinute] = String(period.startTime ?? "00:00").split(":").map(Number);
      const [endHour, endMinute] = String(period.endTime ?? "00:00").split(":").map(Number);
      const start = startHour * 60 + startMinute;
      const end = endHour * 60 + endMinute;
      const isToday = date.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
      return { ...period, workspaceState: isToday && currentMinutes >= start && currentMinutes < end ? "current" : isToday && currentMinutes < start ? "upcoming" : "scheduled" };
    });

    return res.json({
      teacher: { _id: teacher._id, firstName: teacher.firstName, lastName: teacher.lastName },
      academicYear,
      date: date.toISOString().slice(0, 10),
      assignedClasses: classes,
      assignedSections: sections,
      assignedStudents: students,
      todayTimetable: periodWithState,
      attendance,
      homework,
      notifications,
      unreadNotifications: notifications.filter((item: any) => !item.readAt).length,
      permissions: { canMarkAttendance: true },
    });
  } catch (error) {
    next(error);
  }
}
