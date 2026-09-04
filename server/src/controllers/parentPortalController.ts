import { Request, Response, NextFunction } from "express";
import { AcademicYear, Attendance, Exam, Fee, Homework, Notice, Student, Timetable } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";

const dayStart = (date = new Date()) => { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; };
const dayEnd = (date = new Date()) => { const d = dayStart(date); d.setDate(d.getDate() + 1); return d; };
const noticeFilter = (targets: Record<string, unknown>[]) => ({ publishAt: { $lte: new Date() }, $and: [{ $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }] }, { $or: targets }] });

async function currentYear(schoolId: string) { return AcademicYear.findOne({ schoolId, isCurrent: true }).select("_id name startDate endDate").lean(); }
async function childrenForParent(req: Request) { return Student.find({ schoolId: getTenantId(req), parentIds: req.user!.userId, status: "active" }).select("_id admissionNo firstName lastName classId sectionId status").populate("classId sectionId").sort({ firstName: 1, lastName: 1 }).lean(); }
async function childForParent(req: Request, id: string) {
  const child = await Student.findOne({ _id: id, schoolId: getTenantId(req), parentIds: req.user!.userId, status: "active" }).select("_id admissionNo firstName lastName classId sectionId status").populate("classId sectionId").lean();
  if (!child) throw AppError.notFound("Child not found");
  return child;
}

export async function getParentWorkspace(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req); const academicYear = await currentYear(schoolId);
    if (!academicYear) throw AppError.badRequest("No current academic year set");
    const children = await childrenForParent(req);
    const requestedId = typeof req.query.childId === "string" ? req.query.childId : undefined;
    const selectedChild = requestedId ? await childForParent(req, requestedId) : children[0] ?? null;
    if (!selectedChild) return res.json({ role: "parent", academicYear, children: [], selectedChild: null, summary: null, todayClasses: [], attendance: [], upcomingHomework: [], upcomingExams: [], fees: [], notices: [] });

    const classId = (selectedChild.classId as any)?._id ?? selectedChild.classId;
    const sectionId = (selectedChild.sectionId as any)?._id ?? selectedChild.sectionId;
    const sectionScope = sectionId ? { $or: [{ sectionId }, { sectionId: { $exists: false } }] } : { sectionId: { $exists: false } };
    const targets = [{ audience: "school" }, { audience: "class", classId }, ...(sectionId ? [{ audience: "section", classId, sectionId }] : [])];
    const [todayClasses, attendance, homework, exams, fees, notices] = await Promise.all([
      Timetable.find({ schoolId, academicYearId: academicYear._id, classId, ...sectionScope, dayOfWeek: new Date().getDay() || 7 }).populate("subjectId teacherId classId sectionId").sort({ startTime: 1 }).limit(8).lean(),
      Attendance.find({ schoolId, "records.studentId": selectedChild._id, date: { $gte: new Date(Date.now() - 30 * 86400000), $lt: dayEnd() } }).select("date classId sectionId records").sort({ date: -1 }).limit(30).lean(),
      Homework.find({ schoolId, academicYearId: academicYear._id, classId, ...sectionScope, dueDate: { $gte: dayStart(), $lt: dayEnd(new Date(Date.now() + 14 * 86400000)) } }).populate("subjectId classId sectionId").sort({ dueDate: 1 }).limit(8).lean(),
      Exam.find({ schoolId, academicYearId: academicYear._id, classId, status: "published" }).select("name startDate endDate status").sort({ startDate: 1 }).limit(5).lean(),
      Fee.find({ schoolId, studentId: selectedChild._id, academicYear: academicYear._id }).populate("feeStructureId").sort({ createdAt: -1 }).limit(12).lean(),
      Notice.find({ schoolId, ...noticeFilter(targets) }).sort({ priority: -1, publishAt: -1 }).limit(8).lean(),
    ]);
    const present = attendance.filter((item: any) => item.records.some((record: any) => record.studentId.toString() === selectedChild._id.toString() && record.status === "present")).length;
    const fee = fees.reduce((s: any, item: any) => ({ totalDue: s.totalDue + item.totalDue, paid: s.paid + item.paidAmount, balance: s.balance + item.balance, overdue: s.overdue + (item.status === "overdue" ? item.balance : 0) }), { totalDue: 0, paid: 0, balance: 0, overdue: 0 });
    res.json({ role: "parent", academicYear, children, selectedChild, summary: { attendanceTotal: attendance.length, attendancePresent: present, attendanceRate: attendance.length ? Math.round((present / attendance.length) * 100) : 0, fee }, todayClasses, attendance, upcomingHomework: homework, upcomingExams: exams, fees, notices });
  } catch (error) { next(error); }
}
