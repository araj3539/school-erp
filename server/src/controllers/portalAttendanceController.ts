import { Request, Response, NextFunction } from "express";
import { Attendance, Student } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";
import { UserRole } from "@school-erp/shared";

function calendarDate(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function subtractDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - days);
  return result;
}

async function resolveStudent(req: Request): Promise<any> {
  const schoolId = getTenantId(req);
  if (req.user!.role === UserRole.STUDENT) {
    const student = await Student.findOne({ schoolId, userId: req.user!.userId, status: "active" }).select("_id firstName lastName admissionNo classId sectionId").populate("classId sectionId").lean();
    if (!student) throw AppError.notFound("Student record not found");
    return student;
  }
  if (req.user!.role === UserRole.PARENT) {
    const childId = String(req.query.childId || "").trim();
    const filter: any = { schoolId, parentIds: req.user!.userId, status: "active" };
    if (childId) filter._id = childId;
    const student = await Student.findOne(filter).select("_id firstName lastName admissionNo classId sectionId").populate("classId sectionId").lean();
    if (!student) throw AppError.notFound(childId ? "Child not found" : "No linked children found");
    return student;
  }
  throw AppError.forbidden("Portal attendance is not available for this role");
}

export async function getPortalAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const student = await resolveStudent(req);
    const requestedDays = Number(req.query.days || 30);
    const days = Number.isFinite(requestedDays) ? Math.min(90, Math.max(7, Math.trunc(requestedDays))) : 30;
    const endDate = calendarDate(new Date());
    const startDate = subtractDays(endDate, days - 1);
    const attendance = await Attendance.find({ schoolId: getTenantId(req), classId: student.classId?._id || student.classId, sectionId: student.sectionId?._id || student.sectionId, date: { $gte: startDate, $lt: subtractDays(endDate, -1) } }).sort({ date: -1 }).lean();

    const records = attendance.map((entry: any) => {
      const record = entry.records?.find((item: any) => item.studentId?.toString() === student._id.toString());
      return { date: entry.date, status: record?.status || "not_recorded", remark: record?.remark || "" };
    });
    const counts = { present: 0, absent: 0, late: 0, halfDay: 0, onLeave: 0, notRecorded: 0 };
    for (const item of records) {
      if (item.status === "not_recorded") counts.notRecorded++;
      else if (item.status in counts) counts[item.status as keyof typeof counts]++;
    }
    const recorded = records.filter((item) => item.status !== "not_recorded").length;
    const presentEquivalent = counts.present + counts.late + counts.halfDay * 0.5;
    const attendanceRate = recorded ? Math.round((presentEquivalent / recorded) * 100) : null;

    res.json({ student: { _id: student._id, firstName: student.firstName, lastName: student.lastName, admissionNo: student.admissionNo, class: student.classId?.displayName || "", section: student.sectionId?.name || "" }, range: { startDate, endDate, days }, counts, recorded, attendanceRate, records });
  } catch (error) { next(error); }
}
