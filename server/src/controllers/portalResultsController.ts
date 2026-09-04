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
    return { selected: [student], selectable: [student] };
  }
  if (req.user!.role === UserRole.PARENT) {
    const childId = String(req.query.childId || "").trim();
    const filter: any = { schoolId, parentIds: req.user!.userId, status: "active" };
    const selectable = await Student.find(filter).select("_id firstName lastName admissionNo classId sectionId").populate("classId sectionId").sort({ firstName: 1, lastName: 1 }).lean();
    if (!selectable.length) throw AppError.notFound("No linked children found");
    const selected = childId ? selectable.filter((student: any) => student._id.toString() === childId) : selectable;
    if (!selected.length) throw AppError.notFound("Child not found");
    return { selected, selectable };
  }
  throw AppError.forbidden("Portal results are not available for this role");
}

function formatStudent(student: any) {
  return { _id: student._id, firstName: student.firstName, lastName: student.lastName, admissionNo: student.admissionNo, class: student.classId?.displayName || "", section: student.sectionId?.name || "" };
}

export async function getPortalResults(req: Request, res: Response, next: NextFunction) {
  try {
    const scope = await resolveStudents(req);
    const studentIds = scope.selected.map((student: any) => student._id);
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
    res.json({ students: scope.selectable.map(formatStudent), selectedStudentId: scope.selected.length === 1 ? scope.selected[0]._id : null, results: exams });
  } catch (error) { next(error); }
}
