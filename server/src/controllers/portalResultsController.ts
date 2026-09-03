import { Request, Response, NextFunction } from "express";
import { ExamResult, Student } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";
import { UserRole } from "@school-erp/shared";

async function resolveStudents(req: Request) {
  const schoolId = getTenantId(req);
  if (req.user!.role === UserRole.STUDENT) {
    const student = await Student.findOne({ schoolId, userId: req.user!.userId, status: "active" }).select("_id firstName lastName admissionNo classId sectionId").populate("classId sectionId").lean();
    if (!student) throw AppError.notFound("Student record not found");
    return [student];
  }
  if (req.user!.role === UserRole.PARENT) {
    const childId = String(req.query.childId || "").trim();
    const filter: any = { schoolId, parentIds: req.user!.userId, status: "active" };
    if (childId) filter._id = childId;
    const children = await Student.find(filter).select("_id firstName lastName admissionNo classId sectionId").populate("classId sectionId").lean();
    if (!children.length) throw AppError.notFound(childId ? "Child not found" : "No linked children found");
    return children;
  }
  throw AppError.forbidden("Portal results are not available for this role");
}

export async function getPortalResults(req: Request, res: Response, next: NextFunction) {
  try {
    const students = await resolveStudents(req);
    const studentIds = students.map((student: any) => student._id);
    const schoolId = getTenantId(req);
    const results = await ExamResult.find({ schoolId, studentId: { $in: studentIds }, status: "published" })
      .populate("examId studentId classId sectionId marks.subjectId")
      .sort({ createdAt: -1 }).limit(50).lean();
    const exams = results.map((result: any) => ({
      _id: result._id,
      examId: result.examId?._id,
      examName: result.examId?.name || "Exam",
      examType: result.examId?.examType || "",
      startDate: result.examId?.startDate || null,
      endDate: result.examId?.endDate || null,
      studentId: result.studentId?._id || result.studentId,
      studentName: `${result.studentId?.firstName || ""} ${result.studentId?.lastName || ""}`.trim(),
      class: result.classId?.displayName || "",
      section: result.sectionId?.name || "",
      marks: (result.marks || []).map((mark: any) => ({ subject: mark.subjectId?.name || "Subject", value: mark.value, absent: Boolean(mark.absent) })),
      obtainedMarks: result.obtainedMarks,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      grade: result.grade,
      outcome: result.result,
      publishedAt: result.publishedAt || null,
    }));
    res.json({ students: students.map((student: any) => ({ _id: student._id, firstName: student.firstName, lastName: student.lastName, admissionNo: student.admissionNo, class: student.classId?.displayName || "", section: student.sectionId?.name || "" })), results: exams });
  } catch (error) { next(error); }
}
