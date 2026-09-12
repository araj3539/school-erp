import { Types } from "mongoose";
import { Fee, FeeStructure } from "../models/index.js";
import { AppError } from "../utils/errors.js";

export type FeeStructureLifecycle = "draft" | "active" | "archived";
export interface FeeStructurePolicy { lifecycle: FeeStructureLifecycle; concessionPercent?: number; concessionAmount?: number; installments?: Array<{ name: string; amount: number; dueDate: Date }> }

export function calculateConcession(amount: number, policy: Pick<FeeStructurePolicy, "concessionPercent" | "concessionAmount">) {
  if (!Number.isFinite(amount) || amount < 0) throw AppError.badRequest("Fee amount must be a non-negative number");
  const percent = Math.max(0, Math.min(100, Number(policy.concessionPercent ?? 0)));
  const fixed = Math.max(0, Number(policy.concessionAmount ?? 0));
  const discount = Math.min(amount, amount * percent / 100 + fixed);
  return { discount, totalDue: amount - discount };
}

export async function assertFeeStructureCanArchive(id: Types.ObjectId | string, schoolId: Types.ObjectId | string) {
  const count = await Fee.countDocuments({ schoolId, feeStructureId: id, paidAmount: { $gt: 0 } });
  if (count > 0) throw AppError.conflict("A fee structure with collected payments cannot be deleted; archive it instead");
}

export async function archiveFeeStructure(id: Types.ObjectId | string, schoolId: Types.ObjectId | string) {
  await assertFeeStructureCanArchive(id, schoolId);
  return FeeStructure.findOneAndUpdate({ _id: id, schoolId, status: { $ne: "archived" } }, { $set: { status: "archived" } }, { new: true }).lean();
}

export async function activateFeeStructure(id: Types.ObjectId | string, schoolId: Types.ObjectId | string) {
  return FeeStructure.findOneAndUpdate({ _id: id, schoolId, status: { $ne: "archived" } }, { $set: { status: "active" } }, { new: true }).lean();
}
