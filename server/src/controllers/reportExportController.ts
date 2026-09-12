import { Request, Response, NextFunction } from "express";
import { Attendance, Fee, Student } from "../models/index.js";
import { generateExcelFile } from "../services/excel.js";
import { getTenantId } from "../utils/tenant.js";

export async function exportManagementReport(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const type = String(req.query.type ?? "students");
    let rows: Record<string, unknown>[];
    if (type === "students") {
      const data = await Student.find({ schoolId }).populate("classId sectionId").sort({ admissionNo: 1 }).lean();
      rows = data.map((s: any) => ({ admissionNo: s.admissionNo, firstName: s.firstName, lastName: s.lastName, class: s.classId?.displayName ?? s.classId?.name ?? "", section: s.sectionId?.name ?? "", status: s.status, phone: s.phone, admissionDate: s.admissionDate }));
    } else if (type === "fees") {
      const data = await Fee.find({ schoolId }).populate("studentId feeStructureId").sort({ createdAt: -1 }).lean();
      rows = data.map((f: any) => ({ admissionNo: f.studentId?.admissionNo ?? "", student: [f.studentId?.firstName, f.studentId?.lastName].filter(Boolean).join(" "), feeType: f.feeStructureId?.feeType ?? "", amount: f.amount, discount: f.discount, fine: f.fine, totalDue: f.totalDue, paidAmount: f.paidAmount, balance: f.balance, status: f.status, academicYear: f.academicYear }));
    } else if (type === "attendance") {
      const data = await Attendance.find({ schoolId }).populate("classId sectionId").sort({ date: -1 }).lean();
      rows = data.map((a: any) => ({ date: a.date, class: a.classId?.displayName ?? a.classId?.name ?? "", section: a.sectionId?.name ?? "", present: a.records?.filter((r: any) => r.status === "present").length ?? 0, absent: a.records?.filter((r: any) => r.status === "absent").length ?? 0, late: a.records?.filter((r: any) => r.status === "late").length ?? 0, total: a.records?.length ?? 0, lifecycle: a.lifecycle ?? "" }));
    } else {
      return res.status(400).json({ error: "type must be students, fees, or attendance" });
    }
    const buffer = await generateExcelFile(rows, type.charAt(0).toUpperCase() + type.slice(1));
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${type}-report.xlsx`);
    res.send(buffer);
  } catch (error) { next(error); }
}
