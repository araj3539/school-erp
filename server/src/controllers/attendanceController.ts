import { Request, Response, NextFunction } from "express";
import { Attendance, IAttendance, IAttendanceRecord, Student, IStudent, Class, IClass, Section, ISection, Teacher } from "../models/index.js";
import { MarkAttendanceSchema, AttendanceQuerySchema, DateRangeSchema, ObjectIdSchema } from "../validators/index.js";
import { createAuditLog } from "../services/auditLog.js";
import { AppError } from "../utils/errors.js";
import { AttendanceStatus, UserRole } from "@school-erp/shared";
import { Types } from "mongoose";

async function assertTeacherClassAccess(req: Request, classId: string) {
  if (req.user!.role !== UserRole.TEACHER) return;
  const teacher = await Teacher.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId }).select("classTeacherOf").lean();
  if (!teacher || !teacher.classTeacherOf.some((id) => id.toString() === classId)) {
    throw AppError.forbidden("You are not assigned to this class");
  }
}

async function getTeacherClassIds(req: Request) {
  if (req.user!.role !== UserRole.TEACHER) return null;
  const teacher = await Teacher.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId }).select("classTeacherOf").lean();
  return teacher?.classTeacherOf ?? [];
}

async function assertStudentOwnAccess(req: Request, studentId: string) {
  if (req.user!.role !== UserRole.STUDENT) return;
  const student = await Student.findOne({ _id: studentId, schoolId: req.user!.schoolId, userId: req.user!.userId }).select("_id").lean();
  if (!student) throw AppError.forbidden("Students can only access their own attendance");
}

export async function getAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as any;
    const { page = 1, limit = 20, sortBy, sortOrder, ...filters } = query;
    const dbQuery: any = { schoolId: req.user!.schoolId };
    const teacherClassIds = await getTeacherClassIds(req);
    if (teacherClassIds) {
      if (teacherClassIds.length === 0) {
        res.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
        return;
      }
      if (filters.classId) await assertTeacherClassAccess(req, filters.classId);
      else dbQuery.classId = { $in: teacherClassIds };
    }
    if (filters.classId) dbQuery.classId = filters.classId;
    if (filters.sectionId) dbQuery.sectionId = filters.sectionId;
    if (filters.date) {
      const date = new Date(filters.date as string);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      dbQuery.date = { $gte: date, $lt: nextDate };
    }
    if (filters.startDate || filters.endDate) {
      dbQuery.date = {};
      if (filters.startDate) dbQuery.date.$gte = new Date(filters.startDate as string);
      if (filters.endDate) dbQuery.date.$lte = new Date(filters.endDate as string);
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
    const data = req.validatedBody as ReturnType<typeof MarkAttendanceSchema.parse>;
    const schoolId = req.user!.schoolId;
    await assertTeacherClassAccess(req, data.classId);
    const [cls, section] = await Promise.all([
      Class.findOne({ _id: data.classId, schoolId }).select("_id"),
      Section.findOne({ _id: data.sectionId, classId: data.classId, schoolId }).select("_id")
    ]);
    if (!cls || !section) throw AppError.notFound("Class or section not found");
    const studentIds = data.records.map((record) => record.studentId);
    if (new Set(studentIds).size !== studentIds.length) throw AppError.badRequest("Attendance records must contain each student only once");
    const studentCount = await Student.countDocuments({ _id: { $in: studentIds }, classId: data.classId, sectionId: data.sectionId, schoolId, status: "active" });
    if (studentCount !== studentIds.length) throw AppError.badRequest("Attendance records must only contain active students in this class and section");
    const records = data.records.map(r => ({ ...r, studentId: new Types.ObjectId(r.studentId) }));
    const existing = await Attendance.findOne({ date: new Date(data.date), classId: data.classId, sectionId: data.sectionId, schoolId });
    if (existing) {
      existing.records = records;
      existing.markedBy = new Types.ObjectId(req.user!.userId);
      await existing.save();
      await createAuditLog({ userId: req.user!.userId, action: "UPDATE", entity: "Attendance", entityId: existing._id.toString(), after: { recordsCount: records.length } });
      res.json({ attendance: existing });
    } else {
      const attendance = await Attendance.create({ ...data, records, date: new Date(data.date), schoolId, markedBy: new Types.ObjectId(req.user!.userId) });
      await createAuditLog({ userId: req.user!.userId, action: "CREATE", entity: "Attendance", entityId: attendance._id.toString(), after: { recordsCount: data.records.length } });
      res.status(201).json({ attendance });
    }
  } catch (error) { next(error); }
}

export async function getStudentAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as any;
    const { startDate, endDate } = req.validatedQuery as any;
    await assertStudentOwnAccess(req, id);
    const student = await Student.findOne({ _id: id, schoolId: req.user!.schoolId }).select("_id classId").lean();
    if (!student) throw AppError.notFound("Student not found");
    if (req.user!.role === UserRole.TEACHER && student.classId) await assertTeacherClassAccess(req, student.classId.toString());
    const dbQuery: any = { schoolId: req.user!.schoolId, "records.studentId": new Types.ObjectId(id) };
    if (startDate || endDate) {
      dbQuery.date = {};
      if (startDate) dbQuery.date.$gte = new Date(startDate);
      if (endDate) dbQuery.date.$lte = new Date(endDate);
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
    await assertTeacherClassAccess(req, classId.toString());
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
    const schoolId = req.user!.schoolId;
    const section = await Section.findOne({ _id: sectionId, classId, schoolId }).select("_id");
    if (!section) throw AppError.notFound("Class or section not found");
    const students = await Student.find({ classId, sectionId, schoolId, status: "active" }).lean();
    const attendance = await Attendance.find({ classId, sectionId, schoolId, date: { $gte: startDate, $lte: endDate } }).lean();
    const report = students.map((student: any) => {
      const studentAttendance = attendance.map((a) => a.records.find((r) => r.studentId.toString() === student._id.toString())?.status ?? null);
      const counts = { present: 0, absent: 0, late: 0, halfDay: 0, onLeave: 0 };
      studentAttendance.forEach((status) => { if (status) counts[status as keyof typeof counts]++; });
      return { studentId: student._id, admissionNo: student.admissionNo, name: `${student.firstName} ${student.lastName}`, attendance: studentAttendance, counts };
    });
    res.json({ report, month: Number(month), year: Number(year) });
  } catch (error) { next(error); }
}
