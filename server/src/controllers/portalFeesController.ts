import { Request, Response, NextFunction } from "express";
import { Fee, Student } from "../models/index.js";
import { FeeStatus, UserRole } from "@school-erp/shared";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";

export async function getPortalFees(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const childId = String(req.query.childId || "").trim();
    const studentFilter: Record<string, unknown> = { schoolId, status: "active" };
    if (req.user!.role === UserRole.STUDENT) studentFilter.userId = req.user!.userId;
    else if (req.user!.role === UserRole.PARENT) { studentFilter.parentIds = req.user!.userId; if (childId) studentFilter._id = childId; }
    else throw AppError.forbidden("Portal fees are not available for this role");
    const students = await Student.find(studentFilter).select("_id firstName lastName admissionNo classId sectionId").populate("classId sectionId").lean();
    if (!students.length) throw AppError.notFound(childId ? "Child not found" : "Student record not found");
    const studentIds = students.map((student) => student._id);
    const records = await Fee.find({ schoolId, studentId: { $in: studentIds } }).populate("feeStructureId academicYear").sort({ createdAt: -1 }).limit(100).lean();
    const fees = records.map((fee: any) => ({
      _id: fee._id,
      studentId: fee.studentId,
      feeType: fee.feeStructureId?.feeType || "Fee",
      academicYear: fee.academicYear?.name || "",
      dueDate: fee.feeStructureId?.dueDate || null,
      totalDue: fee.totalDue,
      paidAmount: fee.paidAmount,
      balance: fee.balance,
      status: fee.status,
    }));
    const summary = { totalDue: 0, paid: 0, balance: 0, overdue: 0 };
    for (const fee of fees) { summary.totalDue += fee.totalDue; summary.paid += fee.paidAmount; summary.balance += fee.balance; if (fee.status === FeeStatus.OVERDUE) summary.overdue += fee.balance; }
    res.json({ students: students.map((student: any) => ({ _id: student._id, firstName: student.firstName, lastName: student.lastName, admissionNo: student.admissionNo, class: student.classId?.displayName || "", section: student.sectionId?.name || "" })), fees, summary });
  } catch (error) { next(error); }
}
