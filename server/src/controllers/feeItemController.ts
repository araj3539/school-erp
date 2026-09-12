import { Request, Response, NextFunction } from "express";
import { FeeHead } from "../models/index.js";
import { createAuditLog } from "../services/auditLog.js";
import { createFeeItem, adjustFeeItem, listStudentFeeItems } from "../services/feeItemService.js";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";

export async function getFeeHeads(req: Request, res: Response, next: NextFunction) {
  try { const schoolId = getTenantId(req); const data = await FeeHead.find({ schoolId }).sort({ isActive: -1, name: 1 }).lean(); res.json({ data }); } catch (error) { next(error); }
}

export async function createFeeHead(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req); const data = req.validatedBody as any;
    const existing = await FeeHead.findOne({ schoolId, code: String(data.code).toUpperCase() });
    if (existing) throw AppError.conflict("Fee head code already exists");
    const head = await FeeHead.create({ ...data, schoolId, code: String(data.code).toUpperCase(), createdBy: req.user!.userId });
    await createAuditLog({ userId: req.user!.userId, action: "CREATE", entity: "FeeHead", entityId: head._id.toString(), after: head.toObject() });
    res.status(201).json({ feeHead: head });
  } catch (error) { next(error); }
}

export async function updateFeeHead(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string }; const schoolId = getTenantId(req); const data = req.validatedBody as any;
    const before = await FeeHead.findOne({ _id: id, schoolId }).lean(); if (!before) throw AppError.notFound("Fee head not found");
    const head = await FeeHead.findOneAndUpdate({ _id: id, schoolId }, { ...data, ...(data.code ? { code: String(data.code).toUpperCase() } : {}) }, { new: true, runValidators: true });
    if (!head) throw AppError.notFound("Fee head not found");
    await createAuditLog({ userId: req.user!.userId, action: "UPDATE", entity: "FeeHead", entityId: id, before, after: head.toObject() });
    res.json({ feeHead: head });
  } catch (error) { next(error); }
}

export async function getStudentFeeItems(req: Request, res: Response, next: NextFunction) {
  try { const { id } = req.validatedParams as { id: string }; const { academicYear } = req.validatedQuery as any; const data = await listStudentFeeItems(getTenantId(req), id, academicYear); res.json({ data }); } catch (error) { next(error); }
}

export async function createStudentFeeItem(req: Request, res: Response, next: NextFunction) {
  try { const item = await createFeeItem(getTenantId(req), req.validatedBody as any, req.user!.userId); res.status(201).json({ feeItem: item }); } catch (error) { next(error); }
}

export async function adjustStudentFeeItem(req: Request, res: Response, next: NextFunction) {
  try { const { id } = req.validatedParams as { id: string }; const item = await adjustFeeItem(getTenantId(req), id, req.user!.userId, req.validatedBody as any); res.json({ feeItem: item }); } catch (error) { next(error); }
}
