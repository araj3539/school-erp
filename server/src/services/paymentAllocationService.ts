import mongoose from "mongoose";
import { FeeItem, Payment, PaymentAllocation } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { createAuditLog } from "./auditLog.js";

export async function allocatePaymentToItems(schoolId: string, paymentId: string, actorId: string, session?: mongoose.ClientSession) {
  const run = async (tx: mongoose.ClientSession) => {
    const payment = await Payment.findOne({ _id: paymentId, schoolId }).session(tx);
    if (!payment) throw AppError.notFound("Payment not found");
    const existing = await PaymentAllocation.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), paymentId: payment._id, type: "allocation" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).session(tx);
    const alreadyAllocated = existing[0]?.total ?? 0;
    const remainingPayment = payment.amount - alreadyAllocated;
    if (remainingPayment <= 0.009) return { paymentId, allocated: alreadyAllocated, unallocated: 0, allocations: [] };

    const items = await FeeItem.find({ schoolId, studentId: payment.studentId, feeId: payment.feeId, balance: { $gt: 0 } }).sort({ dueDate: 1, createdAt: 1, _id: 1 }).session(tx);
    if (!items.length) return { paymentId, allocated: alreadyAllocated, unallocated: remainingPayment, allocations: [] };
    const allocationRows: Array<{ feeItemId: string; amount: number }> = [];
    let remaining = remainingPayment;
    for (const item of items) {
      if (remaining <= 0.009) break;
      const amount = Math.min(remaining, item.balance);
      if (amount <= 0.009) continue;
      item.paidAmount += amount;
      item.balance = Math.max(0, item.totalDue - item.paidAmount);
      item.status = item.balance === 0 ? (item.totalDue === 0 ? "waived" : "paid") : "partial";
      await item.save({ session: tx });
      const allocation = await PaymentAllocation.create([{ schoolId, paymentId: payment._id, feeItemId: item._id, amount, type: "allocation", createdBy: new mongoose.Types.ObjectId(actorId) }], { session: tx });
      allocationRows.push({ feeItemId: item._id.toString(), amount });
      remaining -= amount;
    }
    await createAuditLog({ userId: actorId, schoolId, action: "PAYMENT_ALLOCATED", entity: "Payment", entityId: paymentId, after: { paymentAmount: payment.amount, allocated: remainingPayment - remaining, unallocated: remaining, allocations: allocationRows }, session: tx });
    return { paymentId, allocated: alreadyAllocated + remainingPayment - remaining, unallocated: remaining, allocations: allocationRows };
  };
  if (session) return run(session);
  const ownSession = await mongoose.startSession();
  try { let result: any; await ownSession.withTransaction(async tx => { result = await run(tx); }); return result; } finally { await ownSession.endSession(); }
}

export async function reversePaymentAllocations(schoolId: string, paymentId: string, reversalId: string, amount: number, actorId: string, session: mongoose.ClientSession) {
  const payment = await Payment.findOne({ _id: paymentId, schoolId }).session(session);
  if (!payment) throw AppError.notFound("Payment not found");
  const allocations = await PaymentAllocation.find({ schoolId, paymentId, type: "allocation" }).sort({ createdAt: -1, _id: -1 }).session(session);
  const alreadyReversed = await PaymentAllocation.aggregate([{ $match: { schoolId: new mongoose.Types.ObjectId(schoolId), paymentId: payment._id, type: "reversal" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]).session(session);
  let remaining = amount;
  const rows: Array<{ feeItemId: string; amount: number }> = [];
  for (const allocation of allocations) {
    if (remaining <= 0.009) break;
    const reversedForAllocation = await PaymentAllocation.aggregate([{ $match: { schoolId: new mongoose.Types.ObjectId(schoolId), reversalId: allocation.reversalId ?? new mongoose.Types.ObjectId("000000000000000000000000") } }, { $group: { _id: null, total: { $sum: "$amount" } } }]).session(session);
    const available = allocation.amount - (reversedForAllocation[0]?.total ?? 0);
    if (available <= 0.009) continue;
    const part = Math.min(remaining, available);
    const item = await FeeItem.findOne({ _id: allocation.feeItemId, schoolId }).session(session);
    if (!item) throw AppError.conflict("A fee item referenced by the payment allocation no longer exists");
    if (part > item.paidAmount + 0.009) throw AppError.conflict("Payment allocation is inconsistent with the fee item ledger");
    item.paidAmount = Math.max(0, item.paidAmount - part);
    item.balance = Math.max(0, item.totalDue - item.paidAmount);
    item.status = item.balance === 0 ? (item.totalDue === 0 ? "waived" : "paid") : item.paidAmount > 0 ? "partial" : "pending";
    await item.save({ session });
    await PaymentAllocation.create([{ schoolId, paymentId: payment._id, feeItemId: item._id, amount: part, type: "reversal", reversalId: new mongoose.Types.ObjectId(reversalId), createdBy: new mongoose.Types.ObjectId(actorId) }], { session });
    rows.push({ feeItemId: item._id.toString(), amount: part });
    remaining -= part;
  }
  if (remaining > 0.009 && allocations.length) throw AppError.conflict("Requested reversal exceeds itemized payment allocation");
  return { reversed: amount - remaining, unallocatedReversal: remaining, allocations: rows, priorReversals: alreadyReversed[0]?.total ?? 0 };
}
