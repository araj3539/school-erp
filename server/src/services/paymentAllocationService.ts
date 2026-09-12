import mongoose from "mongoose";
import { FeeItem, Payment, PaymentAllocation } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { createAuditLog } from "./auditLog.js";

export interface AllocationCandidate { feeItemId: string; balance: number; dueDate?: string | Date; createdAt?: string | Date; }
export interface AllocationPlanRow { feeItemId: string; amount: number; }
export function planPaymentAllocation(paymentAmount: number, candidates: AllocationCandidate[], alreadyAllocated = 0): { allocated: number; unallocated: number; rows: AllocationPlanRow[] } {
  if (!Number.isFinite(paymentAmount) || paymentAmount < 0) throw new Error("Payment amount must be non-negative");
  if (!Number.isFinite(alreadyAllocated) || alreadyAllocated < 0 || alreadyAllocated > paymentAmount + 0.009) throw new Error("Existing allocation is invalid");
  let remaining = Math.max(0, paymentAmount - alreadyAllocated); const rows: AllocationPlanRow[] = [];
  for (const candidate of candidates) { if (remaining <= 0.009) break; if (!Number.isFinite(candidate.balance) || candidate.balance <= 0) continue; const amount = Math.min(remaining, candidate.balance); rows.push({ feeItemId: candidate.feeItemId, amount }); remaining -= amount; }
  return { allocated: paymentAmount - remaining, unallocated: remaining, rows };
}

export async function allocatePaymentToItems(schoolId: string, paymentId: string, actorId: string, session?: mongoose.ClientSession) {
  const run = async (tx: mongoose.ClientSession) => {
    const payment = await Payment.findOne({ _id: paymentId, schoolId }).session(tx); if (!payment) throw AppError.notFound("Payment not found");
    const existing = await PaymentAllocation.aggregate([{ $match: { schoolId: new mongoose.Types.ObjectId(schoolId), paymentId: payment._id, type: "allocation" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]).session(tx);
    const alreadyAllocated = existing[0]?.total ?? 0;
    const items = await FeeItem.find({ schoolId, studentId: payment.studentId, feeId: payment.feeId, balance: { $gt: 0 } }).sort({ dueDate: 1, createdAt: 1, _id: 1 }).session(tx);
    const plan = planPaymentAllocation(payment.amount, items.map(item => ({ feeItemId: item._id.toString(), balance: item.balance })), alreadyAllocated);
    const itemMap = new Map(items.map(item => [item._id.toString(), item]));
    for (const row of plan.rows) { const item = itemMap.get(row.feeItemId)!; item.paidAmount += row.amount; item.balance = Math.max(0, item.totalDue - item.paidAmount); item.status = item.balance === 0 ? (item.totalDue === 0 ? "waived" : "paid") : "partial"; await item.save({ session: tx }); await PaymentAllocation.create([{ schoolId, paymentId: payment._id, feeItemId: item._id, amount: row.amount, type: "allocation", createdBy: new mongoose.Types.ObjectId(actorId) }], { session: tx }); }
    if (plan.rows.length || alreadyAllocated > 0) await createAuditLog({ userId: actorId, schoolId, action: "PAYMENT_ALLOCATED", entity: "Payment", entityId: paymentId, after: { paymentAmount: payment.amount, allocated: plan.allocated, unallocated: plan.unallocated, allocations: plan.rows }, session: tx });
    return { paymentId, ...plan };
  };
  if (session) return run(session); const ownSession = await mongoose.startSession(); try { let result: any; await ownSession.withTransaction(async tx => { result = await run(tx); }); return result; } finally { await ownSession.endSession(); }
}

export async function reversePaymentAllocations(schoolId: string, paymentId: string, reversalId: string, amount: number, actorId: string, session: mongoose.ClientSession) {
  const payment = await Payment.findOne({ _id: paymentId, schoolId }).session(session); if (!payment) throw AppError.notFound("Payment not found");
  const allocations = await PaymentAllocation.find({ schoolId, paymentId, type: "allocation" }).sort({ createdAt: -1, _id: -1 }).session(session); let remaining = amount; const rows: AllocationPlanRow[] = [];
  for (const allocation of allocations) { if (remaining <= 0.009) break; const reversed = await PaymentAllocation.aggregate([{ $match: { schoolId: new mongoose.Types.ObjectId(schoolId), originalAllocationId: allocation._id, type: "reversal" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]).session(session); const available = allocation.amount - (reversed[0]?.total ?? 0); if (available <= 0.009) continue; const part = Math.min(remaining, available); const item = await FeeItem.findOne({ _id: allocation.feeItemId, schoolId }).session(session); if (!item) throw AppError.conflict("A fee item referenced by the payment allocation no longer exists"); if (part > item.paidAmount + 0.009) throw AppError.conflict("Payment allocation is inconsistent with the fee item ledger"); item.paidAmount = Math.max(0, item.paidAmount - part); item.balance = Math.max(0, item.totalDue - item.paidAmount); item.status = item.balance === 0 ? (item.totalDue === 0 ? "waived" : "paid") : item.paidAmount > 0 ? "partial" : "pending"; await item.save({ session }); await PaymentAllocation.create([{ schoolId, paymentId: payment._id, feeItemId: item._id, amount: part, type: "reversal", reversalId: new mongoose.Types.ObjectId(reversalId), originalAllocationId: allocation._id, createdBy: new mongoose.Types.ObjectId(actorId) }], { session }); rows.push({ feeItemId: item._id.toString(), amount: part }); remaining -= part; }
  if (remaining > 0.009 && allocations.length) throw AppError.conflict("Requested reversal exceeds itemized payment allocation"); return { reversed: amount - remaining, unallocatedReversal: remaining, allocations: rows };
}
