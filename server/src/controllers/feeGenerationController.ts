import { Request, Response, NextFunction } from "express";
import { Fee, FeeHead, FeeItem, FeeStructure, Student } from "../models/index.js";
import { calculateConcession } from "../services/feeStructureService.js";
import { createAuditLog } from "../services/auditLog.js";
import { AppError } from "../utils/errors.js";
import { FeeStatus } from "@school-erp/shared";
const body = (req: Request) => { const { classId, academicYear } = req.body || {}; if (!classId || !academicYear) throw AppError.badRequest("classId and academicYear are required"); return { classId, academicYear }; };
async function plan(schoolId: string, classId: string, academicYear: string) {
  const [students, structures] = await Promise.all([Student.find({ schoolId, classId, status: "active" }).select("_id firstName lastName admissionNo").lean(), FeeStructure.find({ schoolId, classId, academicYear, status: "active" }).populate("feeHeadId", "name code").lean()]);
  if (!students.length || !structures.length) throw AppError.badRequest("No active students or active fee structures found");
  const feeIds = await Fee.find({ schoolId, studentId: { $in: students.map(s => s._id) }, academicYear }).select("_id studentId feeStructureId").lean();
  const existing = new Set(feeIds.map(f => `${f.studentId}:${f.feeStructureId}`));
  const itemIds = await FeeItem.find({ schoolId, studentId: { $in: students.map(s => s._id) }, academicYear }).select("studentId feeId feeHeadId").lean();
  const itemSet = new Set(itemIds.map(i => `${i.studentId}:${i.feeId}:${i.feeHeadId}`));
  const operations: any[] = []; let unmapped = 0;
  for (const student of students) for (const structure of structures) { const key = `${student._id}:${structure._id}`; const concession = calculateConcession(structure.amount, structure); const feeHead = structure.feeHeadId as any; if (!feeHead?._id) unmapped++; operations.push({ student, structure, concession, feeExists: existing.has(key), feeHead, itemExists: false, itemKey: "" }); }
  for (const op of operations) { if (op.feeHead) { const known = feeIds.find(f => f.studentId.toString() === op.student._id.toString() && f.feeStructureId.toString() === op.structure._id.toString()); op.itemExists = known ? itemSet.has(`${op.student._id}:${known._id}:${op.feeHead._id}`) : false; op.itemKey = known ? `${op.student._id}:${known._id}:${op.feeHead._id}` : ""; } }
  return { students, structures, operations, unmapped, newFees: operations.filter(x => !x.feeExists).length, newItems: operations.filter(x => x.feeHead && !x.itemExists).length };
}
export async function previewItemizedFeeGeneration(req: Request, res: Response, next: NextFunction) { try { const { classId, academicYear } = body(req); const p = await plan(req.user!.schoolId, classId, academicYear); res.json({ preview: { classId, academicYear, students: p.students.length, structures: p.structures.length, prospectiveFees: p.newFees, prospectiveItems: p.newItems, unmappedStructures: p.unmapped, warnings: p.unmapped ? ["Some active fee structures have no fee head mapping; those structures will not create itemized FeeItems."] : [] } }); } catch (e) { next(e); } }
export async function generateItemizedFees(req: Request, res: Response, next: NextFunction) { try { const { classId, academicYear } = body(req); const schoolId = req.user!.schoolId; const p = await plan(schoolId, classId, academicYear); let feesCreated = 0, itemsCreated = 0;
  for (const op of p.operations) { let fee = await Fee.findOne({ schoolId, studentId: op.student._id, feeStructureId: op.structure._id, academicYear }); if (!fee) { const { discount, totalDue } = op.concession; fee = await Fee.create({ schoolId, studentId: op.student._id, feeStructureId: op.structure._id, amount: op.structure.amount, discount, fine: 0, totalDue, paidAmount: 0, balance: totalDue, status: FeeStatus.PENDING, academicYear }); feesCreated++; }
    if (op.feeHead && !op.itemExists) { await FeeItem.create({ schoolId, studentId: op.student._id, feeId: fee._id, feeHeadId: op.feeHead._id, academicYear, label: op.feeHead.name, amount: op.structure.amount, discount: op.concession.discount, fine: 0, totalDue: op.concession.totalDue, paidAmount: 0, balance: op.concession.totalDue, status: "pending", dueDate: op.structure.dueDate, adjustments: [] }); itemsCreated++; }
  }
  await createAuditLog({ userId: req.user!.userId, schoolId, action: "GENERATE_ITEMIZED_FEES", entity: "Fee", entityId: classId, after: { classId, academicYear, feesCreated, itemsCreated, unmappedStructures: p.unmapped } }); res.json({ generated: { fees: feesCreated, items: itemsCreated }, unmappedStructures: p.unmapped }); } catch (e) { next(e); } }
