import { Attendance, Fee, Student } from "../models/index.js";
import { Request, Response, NextFunction } from "express";
import { generateExcelFile } from "../services/excel.js";
import { getTenantId } from "../utils/tenant.js";
import { getFeeDefaulters, getFeeLedgerSummary, getPaymentReconciliationExceptions } from "../services/feeOperationsReportService.js";

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
    } else if (type === "fee-defaulters") {
      const result = await getFeeDefaulters({ schoolId, page: 1, limit: 100000, classId: String(req.query.classId || "") || undefined, sectionId: String(req.query.sectionId || "") || undefined, feeHeadId: String(req.query.feeHeadId || "") || undefined, academicYear: String(req.query.academicYear || "") || undefined, agingBucket: String(req.query.agingBucket || "") || undefined, asOf: String(req.query.asOf || "") || undefined });
      rows = result.data.map((item: any) => ({ admissionNo: item.student?.admissionNo ?? "", student: [item.student?.firstName, item.student?.lastName].filter(Boolean).join(" "), class: item.class?.displayName ?? item.class?.name ?? "", section: item.section?.name ?? "", feeHead: item.feeHead?.name ?? item.label ?? "", dueDate: item.dueDate, totalDue: item.totalDue, paidAmount: item.paidAmount, balance: item.balance, daysOverdue: item.daysOverdue, agingBucket: item.agingBucket }));
    } else if (type === "fee-ledger") {
      const result = await getFeeLedgerSummary({ schoolId, classId: String(req.query.classId || "") || undefined, sectionId: String(req.query.sectionId || "") || undefined, feeHeadId: String(req.query.feeHeadId || "") || undefined, academicYear: String(req.query.academicYear || "") || undefined, startDate: String(req.query.startDate || "") || undefined, endDate: String(req.query.endDate || "") || undefined });
      rows = result.byHead.map((item: any) => ({ feeHead: item.feeHead?.name ?? item._id?.toString() ?? "", code: item.feeHead?.code ?? "", items: item.items, amount: item.amount, discount: item.discount, fine: item.fine, totalDue: item.totalDue, paid: item.paid, balance: item.balance }));
    } else if (type === "reconciliation-exceptions") {
      const result = await getPaymentReconciliationExceptions({ schoolId, page: 1, limit: 100000, startDate: String(req.query.startDate || "") || undefined, endDate: String(req.query.endDate || "") || undefined });
      rows = result.data.map((item: any) => ({ paymentId: item._id?.toString() ?? "", studentId: item.studentId?.toString() ?? "", feeId: item.feeId?.toString() ?? "", receiptNo: item.receiptNo, amount: item.amount, allocatedAmount: item.allocatedAmount, difference: item.difference, mode: item.mode, transactionId: item.transactionId, date: item.date }));
    } else if (type === "attendance") {
      const data = await Attendance.find({ schoolId }).populate("classId sectionId").sort({ date: -1 }).lean();
      rows = data.map((a: any) => ({ date: a.date, class: a.classId?.displayName ?? a.classId?.name ?? "", section: a.sectionId?.name ?? "", present: a.records?.filter((r: any) => r.status === "present").length ?? 0, absent: a.records?.filter((r: any) => r.status === "absent").length ?? 0, late: a.records?.filter((r: any) => r.status === "late").length ?? 0, total: a.records?.length ?? 0, lifecycle: a.lifecycle ?? "" }));
    } else {
      return res.status(400).json({ error: "unsupported report type" });
    }
    const buffer = await generateExcelFile(rows, type.charAt(0).toUpperCase() + type.slice(1));
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${type}-report.xlsx`);
    res.send(buffer);
  } catch (error) { next(error); }
}
