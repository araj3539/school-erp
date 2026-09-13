import { Request, Response, NextFunction } from "express";
import { Fee, FeeItem, FeeStructure, Student } from "../models/index.js";
import { calculateConcession } from "../services/feeStructureService.js";
import { createAuditLog } from "../services/auditLog.js";
import { AppError } from "../utils/errors.js";
import { FeeStatus } from "@school-erp/shared";

const context = (req: Request) => {
  if (!req.user?.schoolId || !req.user.userId) throw AppError.forbidden("A school and authenticated user are required");
  return { schoolId: req.user.schoolId, userId: req.user.userId };
};

const body = (req: Request) => {
  const { classId, academicYear } = req.body || {};
  if (!classId || !academicYear) throw AppError.badRequest("classId and academicYear are required");
  return { classId, academicYear };
};

async function plan(schoolId: string, classId: string, academicYear: string) {
  const [students, structures] = await Promise.all([
    Student.find({ schoolId, classId, status: "active" }).select("_id firstName lastName admissionNo").lean(),
    FeeStructure.find({ schoolId, classId, academicYear, status: "active" }).populate("feeHeadId", "name code").lean(),
  ]);
  if (!students.length || !structures.length) throw AppError.badRequest("No active students or active fee structures found");

  const feeIds = await Fee.find({ schoolId, studentId: { $in: students.map(s => s._id) }, academicYear })
    .select("_id studentId feeStructureId paidAmount totalDue balance")
    .lean();
  const existing = new Set(feeIds.map(f => `${f.studentId}:${f.feeStructureId}`));
  const itemIds = await FeeItem.find({ schoolId, studentId: { $in: students.map(s => s._id) }, academicYear })
    .select("studentId feeId feeHeadId")
    .lean();
  const itemSet = new Set(itemIds.map(i => `${i.studentId}:${i.feeId}:${i.feeHeadId}`));

  const operations: any[] = [];
  let unmapped = 0;
  let paidAggregateBlocked = 0;
  for (const student of students) {
    for (const structure of structures) {
      const key = `${student._id}:${structure._id}`;
      const concession = calculateConcession(structure.amount, structure);
      const feeHead = structure.feeHeadId as any;
      if (!feeHead?._id) unmapped++;
      const known = feeIds.find(f => f.studentId.toString() === student._id.toString() && f.feeStructureId.toString() === structure._id.toString());
      const feeExists = existing.has(key);
      const paidAggregateBlockedForItemization = Boolean(known && (known.paidAmount ?? 0) > 0);
      if (paidAggregateBlockedForItemization && feeHead?._id) paidAggregateBlocked++;
      operations.push({
        student,
        structure,
        concession,
        feeExists,
        feeHead,
        itemExists: known ? itemSet.has(`${student._id}:${known._id}:${feeHead?._id}`) : false,
        itemKey: known ? `${student._id}:${known._id}:${feeHead?._id}` : "",
        paidAggregateBlockedForItemization,
      });
    }
  }

  return {
    students,
    structures,
    operations,
    unmapped,
    paidAggregateBlocked,
    newFees: operations.filter(x => !x.feeExists).length,
    newItems: operations.filter(x => x.feeHead && !x.itemExists && !x.paidAggregateBlockedForItemization).length,
  };
}

export async function previewItemizedFeeGeneration(req: Request, res: Response, next: NextFunction) {
  try {
    const { schoolId } = context(req);
    const { classId, academicYear } = body(req);
    const p = await plan(schoolId, classId, academicYear);
    res.json({
      preview: {
        classId,
        academicYear,
        students: p.students.length,
        structures: p.structures.length,
        prospectiveFees: p.newFees,
        prospectiveItems: p.newItems,
        unmappedStructures: p.unmapped,
        paidAggregateBlocked: p.paidAggregateBlocked,
        warnings: [
          ...(p.unmapped ? ["Some active fee structures have no fee head mapping; those structures will not create itemized FeeItems."] : []),
          ...(p.paidAggregateBlocked ? ["Some existing aggregate fees already have payments; those fees are blocked from itemization to prevent incorrect zero-paid FeeItems."] : []),
        ],
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function generateItemizedFees(req: Request, res: Response, next: NextFunction) {
  try {
    const { schoolId, userId } = context(req);
    const { classId, academicYear } = body(req);
    const p = await plan(schoolId, classId, academicYear);
    let feesCreated = 0;
    let itemsCreated = 0;
    let paidAggregateBlocked = 0;

    for (const op of p.operations) {
      let fee = await Fee.findOne({ schoolId, studentId: op.student._id, feeStructureId: op.structure._id, academicYear });
      if (!fee) {
        const { discount, totalDue } = op.concession;
        fee = await Fee.create({
          schoolId,
          studentId: op.student._id,
          feeStructureId: op.structure._id,
          amount: op.structure.amount,
          discount,
          fine: 0,
          totalDue,
          paidAmount: 0,
          balance: totalDue,
          status: FeeStatus.PENDING,
          academicYear,
        });
        feesCreated++;
      }

      if (op.feeHead && !op.itemExists) {
        if ((fee.paidAmount ?? 0) > 0) {
          paidAggregateBlocked++;
          continue;
        }
        await FeeItem.create({
          schoolId,
          studentId: op.student._id,
          feeId: fee._id,
          feeHeadId: op.feeHead._id,
          academicYear,
          label: op.feeHead.name,
          amount: op.structure.amount,
          discount: op.concession.discount,
          fine: 0,
          totalDue: op.concession.totalDue,
          paidAmount: 0,
          balance: op.concession.totalDue,
          status: "pending",
          dueDate: op.structure.dueDate,
          adjustments: [],
        });
        itemsCreated++;
      }
    }

    await createAuditLog({
      userId,
      schoolId,
      action: "GENERATE_ITEMIZED_FEES",
      entity: "Fee",
      entityId: classId,
      after: { classId, academicYear, feesCreated, itemsCreated, paidAggregateBlocked, unmappedStructures: p.unmapped },
    });
    res.json({ generated: { fees: feesCreated, items: itemsCreated }, paidAggregateBlocked, unmappedStructures: p.unmapped });
  } catch (e) {
    next(e);
  }
}
