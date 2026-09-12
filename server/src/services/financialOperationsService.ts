import mongoose from "mongoose";
import { BankTransaction, FeePolicyApproval, FeeStructure, PaymentOrder } from "../models/index.js";
import { settleUpiPaymentOrder } from "./upiPaymentService.js";
import { createAuditLog } from "./auditLog.js";
import { AppError } from "../utils/errors.js";

export async function listBankTransactions(schoolId: string, page = 1, limit = 25, status?: string) {
  const filter: Record<string, unknown> = { schoolId }; if (status) filter.status = status;
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([BankTransaction.find(filter).populate("matchedOrderId candidateOrderIds").sort({ date: -1, _id: -1 }).skip(skip).limit(limit).lean(), BankTransaction.countDocuments(filter)]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function resolveBankTransaction(schoolId: string, id: string, orderId: string, actorId: string) {
  const tx = await BankTransaction.findOne({ _id: id, schoolId }); if (!tx) throw AppError.notFound("Bank transaction not found");
  if (tx.status === "matched") throw AppError.conflict("Bank transaction is already matched");
  const order = await PaymentOrder.findOne({ _id: orderId, schoolId, status: "pending" }); if (!order) throw AppError.conflict("Selected payment order is not pending or belongs to another school");
  if (Math.abs(order.amount - tx.amount) >= 0.01) throw AppError.badRequest("Bank amount must exactly match the payment order amount");
  if (tx.candidateOrderIds.length && !tx.candidateOrderIds.some(x => x.toString() === orderId)) throw AppError.badRequest("Selected order is not one of the reconciliation candidates");
  await settleUpiPaymentOrder(schoolId, orderId, actorId, true);
  tx.status = "matched"; tx.matchedOrderId = new mongoose.Types.ObjectId(orderId); tx.candidateOrderIds = [new mongoose.Types.ObjectId(orderId)]; await tx.save();
  await createAuditLog({ userId: actorId, schoolId, action: "BANK_TRANSACTION_MATCHED", entity: "BankTransaction", entityId: id, after: { orderId, utr: tx.utr, amount: tx.amount, manual: true } });
  return tx.toObject();
}

export async function ignoreBankTransaction(schoolId: string, id: string, actorId: string) {
  const tx = await BankTransaction.findOne({ _id: id, schoolId }); if (!tx) throw AppError.notFound("Bank transaction not found");
  if (tx.status === "matched") throw AppError.conflict("Matched transactions cannot be ignored");
  tx.status = "ignored"; await tx.save();
  await createAuditLog({ userId: actorId, schoolId, action: "BANK_TRANSACTION_IGNORED", entity: "BankTransaction", entityId: id, after: { utr: tx.utr } });
  return tx.toObject();
}

export async function listFeePolicyApprovals(schoolId: string, status = "pending") {
  return FeePolicyApproval.find({ schoolId, status }).populate("feeStructureId requestedBy reviewedBy").sort({ requestedAt: -1 }).lean();
}

export async function requestFeePolicyApproval(schoolId: string, feeStructureId: string, proposedChanges: Record<string, unknown>, actorId: string) {
  const structure = await FeeStructure.findOne({ _id: feeStructureId, schoolId }).lean(); if (!structure) throw AppError.notFound("Fee structure not found");
  const pending = await FeePolicyApproval.findOne({ schoolId, feeStructureId, status: "pending" }).lean(); if (pending) throw AppError.conflict("A fee policy approval is already pending");
  const approval = await FeePolicyApproval.create({ schoolId, feeStructureId, proposedChanges, requestedBy: actorId });
  await createAuditLog({ userId: actorId, schoolId, action: "FEE_POLICY_APPROVAL_REQUESTED", entity: "FeePolicyApproval", entityId: approval._id.toString(), after: { feeStructureId, proposedChanges } });
  return approval;
}

export async function reviewFeePolicyApproval(schoolId: string, id: string, actorId: string, approved: boolean, reason?: string) {
  const approval = await FeePolicyApproval.findOne({ _id: id, schoolId, status: "pending" }); if (!approval) throw AppError.notFound("Pending fee policy approval not found");
  if (approval.requestedBy.toString() === actorId) throw AppError.forbidden("Maker-checker requires a different reviewer");
  if (!approved && !reason?.trim()) throw AppError.badRequest("A rejection reason is required");
  if (approved) {
    const structure = await FeeStructure.findOne({ _id: approval.feeStructureId, schoolId, status: { $ne: "archived" } }); if (!structure) throw AppError.notFound("Fee structure not found");
    Object.assign(structure, approval.proposedChanges); await structure.save();
  }
  approval.status = approved ? "approved" : "rejected"; approval.reviewedBy = new mongoose.Types.ObjectId(actorId); approval.reviewedAt = new Date(); approval.reviewReason = reason?.trim(); await approval.save();
  await createAuditLog({ userId: actorId, schoolId, action: approved ? "FEE_POLICY_APPROVED" : "FEE_POLICY_REJECTED", entity: "FeePolicyApproval", entityId: id, after: { approved, reason } });
  return approval;
}
