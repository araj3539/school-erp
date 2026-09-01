import { Request, Response, NextFunction } from "express";
import { Attendance, Student, Class, Section, Teacher, AcademicYear, School } from "../models/index.js";
import { createAuditLog } from "../services/auditLog.js";
import { AppError } from "../utils/errors.js";
import { parseCalendarDate, addCalendarDays } from "../utils/calendarDate.js";
import { getTenantId } from "../utils/tenant.js";
import { UserRole } from "@school-erp/shared";
import { Types } from "mongoose";

async function assertTeacherClassAccess(req: Request, classId: string) {
  if (req.user!.role !== UserRole.TEACHER) return;
  const teacher = await Teacher.findOne({ userId: req.user!.userId, schoolId: getTenantId(req) }).select("classTeacherOf").lean();
  if (!teacher || !teacher.classTeacherOf.some((id) => id.toString() === classId)) throw AppError.forbidden("You are not assigned to this class");
}
async function getTeacherClassIds(req: Request) {
  if (req.user!.role !== UserRole.TEACHER) return null;
  const teacher = await Teacher.findOne({ userId: req.user!.userId, schoolId: getTenantId(req) }).select("classTeacherOf").lean();
  return teacher?.classTeacherOf ?? [];
}
async function assertStudentOwnAccess(req: Request, studentId: string) {
  if (req.user!.role !== UserRole.STUDENT) return;
  const student = await Student.findOne({ _id: studentId, schoolId: getTenantId(req), userId: req.user!.userId }).select("_id").lean();
  if (!student) throw AppError.forbidden("Students can only access their own attendance");
}
async function assertParentChildAccess(req: Request, studentId: string) {
  if (req.user!.role !== UserRole.PARENT) return;
  const student = await Student.findOne({ _id: studentId, schoolId: getTenantId(req), parentIds: req.user!.userId }).select("_id").lean();
  if (!student) throw AppError.forbidden("Parents can only access attendance for their linked children");
}
async function assertAttendanceDateInCurrentAcademicYear(schoolId: Types.ObjectId, date: Date) {
  const school = await School.findById(schoolId).select("academicYear").lean();
  if (!school?.academicYear) throw AppError.conflict("School does not have a current academic year configured");
  const academicYear = await AcademicYear.findOne({ _id: school.academicYear, schoolId }).select("startDate endDate").lean();
  if (!academicYear) throw AppError.conflict("Current academic year could not be resolved");
  if (date < academicYear.startDate || date >= academicYear.endDate) {
    throw AppError.badRequest("Attendance date must fall within the current academic year");
  }
}
async function assertAttendanceCorrectionAccess(req: Request) {
  if (req.user!.role !== UserRole.PRINCIPAL && req.user!.role !== UserRole.SUPER_ADMIN) {
    throw AppError.forbidden("Only school management can correct existing attendance");
  }
}

export async function getAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as any;
    const { page = 1, limit = 20, sortBy, sortOrder, ...filters } = query;
    const dbQuery: any = { schoolId: getTenantId(req) };
    const teacherClassIds = await getTeacherClassIds(req);
    if (teacherClassIds) {
      if (teacherClassIds.length === 0) return res.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      if (filters.classId) await assertTeacherClassAccess(req, filters.classId);
      else dbQuery.classId = { $in: teacherClassIds };
    }
    if (filters.classId) dbQuery.classId = filters.classId;
    if (filters.sectionId) dbQuery.sectionId = filters.sectionId;
    if (filters.date) {
      const date = parseCalendarDate(String(filters.date));
      dbQuery.date = { $gte: date, $lt: addCalendarDays(date, 1) };
    }
    if (filters.startDate || filters.endDate) {
      dbQuery.date = {};
      if (filters.startDate) dbQuery.date.$gte = parseCalendarDate(String(filters.startDate));
      if (filters.endDate) dbQuery.date.$lt = addCalendarDays(parseCalendarDate(String(filters.endDate)), 1);
    }
    const sort: any = {};
    if (sortBy) sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    else sort.date = -1;
    const skip = (page - 1) * limit;
    const [attendance, total] = await Promise.all([
      Attendance.find(dbQuery).populate("classId sectionId markedBy").sort(sort).skip(skip).limit(limit).lean(),
      Attendance.countDocuments(dbQuery)
    ]);
    res.json({ data: attendance, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

export async function markAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.validatedBody as any;
    const schoolId = getTenantId(req);
    const schoolObjectId = new Types.ObjectId(schoolId);
    const date = parseCalendarDate(String(data.date));
    await assertAttendanceDateInCurrentAcademicYear(schoolObjectId, date);
    await assertTeacherClassAccess(req, data.classId);
    const [cls, section] = await Promise.all([
      Class.findOne({ _id: data.classId, schoolId }).select("_id"),
      Section.findOne({ _id: data.sectionId, classId: data.classId, schoolId }).select("_id")
    ]);
    if (!cls || !section) throw AppError.notFound("Class or section not found");
    const studentIds = data.records.map((record: any) => record.studentId);
    if (new Set(studentIds).size !== studentIds.length) throw AppError.badRequest("Attendance records must contain each student only once");
    const studentCount = await Student.countDocuments({ _id: { $in: studentIds }, classId: data.classId, sectionId: data.sectionId, schoolId, status: "active" });
    if (studentCount !== studentIds.length) throw AppError.badRequest("Attendance records must only contain active students in this class and section");
    const records = data.records.map((r: any) => ({ ...r, studentId: new Types.ObjectId(r.studentId) }));
    const existing = await Attendance.findOne({ date, classId: data.classId, sectionId: data.sectionId, schoolId });
    if (existing) {
      await assertAttendanceCorrectionAccess(req);
      const before = existing.records.map((record) => ({ studentId: record.studentId.toString(), status: record.status, remark: record.remark }));
      existing.records = records;
      existing.markedBy = new Types.ObjectId(req.user!.userId);
      await existing.save();
      await createAuditLog({ schoolId, userId: req.user!.userId, action: "CORRECT", entity: "Attendance", entityId: existing._id.toString(), before: { records: before }, after: { recordsCount: records.length, date: date.toISOString(), classId: data.classId, sectionId: data.sectionId } });
      return res.json({ attendance: existing, corrected: true });
    }
    const attendance = await Attendance.create({ ...data, records, date, schoolId, markedBy: new Types.ObjectId(req.user!.userId) });
    await createAuditLog({ schoolId, userId: req.user!.userId, action: "CREATE", entity: "Attendance", entityId: attendance._id.toString(), after: { recordsCount: data.records.length, date: date.toISOString(), classId: data.classId, sectionId: data.sectionId } });
    res.status(201).json({ attendance, corrected: false });
  } catch (error) { next(error); }
}

export async function getStudentAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    const { startDate, endDate } = req.validatedQuery as any;
    const schoolId = getTenantId(req);
    await assertStudentOwnAccess(req, id);
    await assertParentChildAccess(req, id);
    const student = await Student.findOne({ _id: id, schoolId }).select("_id classId").lean();
    if (!student) throw AppError.notFound("Student not found");
    if (req.user!.role === UserRole.TEACHER && student.classId) await assertTeacherClassAccess(req, student.classId.toString());
    const dbQuery: any = { schoolId, "records.studentId": new Types.ObjectId(id) };
    if (startDate || endDate) {
      dbQuery.date = {};
      if (startDate) dbQuery.date.$gte = parseCalendarDate(String(startDate));
      if (endDate) dbQuery.date.$lt = addCalendarDays(parseCalendarDate(String(endDate)), 1);
    }
    const attendance = await Attendance.find(dbQuery).sort({ date: -1 }).lean();
    const summary = { present: 0, absent: 0, late: 0, halfDay: 0, onLeave: 0 };
    attendance.forEach((a) => {
      const record = a.records.find((r) => r.studentId.toString() === id);
      if (record) summary[record.status as keyof typeof summary]++;
    });
    res.json({ attendance, summary });
  } catch (error) { next(error); }
}

export async function getMonthlyAttendanceReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, sectionId, month, year } = req.query;
    if (!classId || !sectionId || !month || !year) throw AppError.badRequest("classId, sectionId, month, year required");
    const numericMonth = Number(month);
    const numericYear = Number(year);
    if (!Number.isInteger(numericMonth) || numericMonth < 1 || numericMonth > 12 || !Number.isInteger(numericYear) || numericYear < 2000 || numericYear > 2100) throw AppError.badRequest("Invalid month or year");
    await assertTeacherClassAccess(req, classId.toString());
    const startDate = new Date(Date.UTC(numericYear, numericMonth - 1, 1));
    const endDate = new Date(Date.UTC(numericYear, numericMonth, 1));
    const schoolId = getTenantId(req);
    const school = await School.findById(schoolId).select("academicYear").lean();
    if (!school?.academicYear) throw AppError.conflict("School does not have a current academic year configured");
    const academicYear = await AcademicYear.findOne({ _id: school.academicYear, schoolId }).select("startDate endDate name").lean();
    if (!academicYear) throw AppError.conflict("Current academic year could not be resolved");
    if (startDate < academicYear.startDate || startDate >= academicYear.endDate) throw AppError.badRequest("Attendance report must fall within the current academic year");
    const section = await Section.findOne({ _id: sectionId, classId, schoolId }).select("_id");
    if (!section) throw AppError.notFound("Class or section not found");
    const students = await Student.find({ classId, sectionId, schoolId, status: "active" }).lean();
    const attendance = await Attendance.find({ classId, sectionId, schoolId, date: { $gte: startDate, $lt: endDate } }).lean();
    const report = students.map((student: any) => {
      const studentAttendance = attendance.map((a) => a.records.find((r) => r.studentId.toString() === student._id.toString())?.status ?? null);
      const counts = { present: 0, absent: 0, late: 0, halfDay: 0, onLeave: 0 };
      studentAttendance.forEach((status) => { if (status) counts[status as keyof typeof counts]++; });
      return { studentId: student._id, admissionNo: student.admissionNo, name: `${student.firstName} ${student.lastName}`, attendance: studentAttendance, counts };
    });
    res.json({ report, month: numericMonth, year: numericYear, academicYear: academicYear.name });
  } catch (error) { next(error); }
}
