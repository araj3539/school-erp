import mongoose from "mongoose";
import { BankTransaction, PaymentOrder } from "../models/index.js";
import { settleUpiPaymentOrder } from "./upiPaymentService.js";
import { createAuditLog } from "./auditLog.js";

export async function importAndReconcileBankTransactions(schoolId: string, transactions: Array<{ utr: string; amount: number; date: string; payerUpiId?: string }>, actorId: string) {
  const results: Array<Record<string, unknown>> = [];
  for (const transaction of transactions) {
    const utr = transaction.utr.trim().toUpperCase();
    const existingRecord = await BankTransaction.findOne({ schoolId, utr }).lean();
    if (existingRecord) { results.push({ utr, result: existingRecord.status === "matched" ? "already_matched" : existingRecord.status, bankTransactionId: existingRecord._id.toString(), orderId: existingRecord.matchedOrderId?.toString() }); continue; }
    const date = new Date(transaction.date); const from = new Date(date.getTime() - 24 * 60 * 60 * 1000); const to = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    const exact = await PaymentOrder.findOne({ schoolId, utr, status: "pending" }).lean();
    let candidates = exact ? [exact] : await PaymentOrder.find({ schoolId, status: "pending", amount: transaction.amount, submittedAt: { $gte: from, $lte: to }, ...(transaction.payerUpiId ? { payerUpiId: transaction.payerUpiId.trim().toLowerCase() } : {}) }).select("_id amount").lean();
    if (exact && Math.abs(exact.amount - transaction.amount) >= 0.01) candidates = [];
    const status = candidates.length === 1 ? "matched" : candidates.length > 1 ? "ambiguous" : "unmatched";
    const record = await BankTransaction.create({ schoolId, utr, amount: transaction.amount, date, payerUpiId: transaction.payerUpiId, source: "manual_import", status, matchedOrderId: status === "matched" ? candidates[0]._id : undefined, candidateOrderIds: candidates.map(candidate => candidate._id), importedBy: new mongoose.Types.ObjectId(actorId), importedAt: new Date() });
    if (status === "matched") {
      try { await settleUpiPaymentOrder(schoolId, candidates[0]._id.toString(), actorId, true); await createAuditLog({ userId: actorId, schoolId, action: "BANK_TRANSACTION_MATCHED", entity: "BankTransaction", entityId: record._id.toString(), after: { utr, orderId: candidates[0]._id.toString(), amount: transaction.amount }, }); results.push({ utr, result: "auto_verified", bankTransactionId: record._id.toString(), orderId: candidates[0]._id.toString() }); }
      catch (error) { await BankTransaction.updateOne({ _id: record._id, schoolId }, { $set: { status: "unmatched" }, $unset: { matchedOrderId: 1 }, $setOnInsert: {} }); results.push({ utr, result: "match_failed", bankTransactionId: record._id.toString(), message: error instanceof Error ? error.message : "Settlement failed" }); }
    } else results.push({ utr, result: status, bankTransactionId: record._id.toString(), candidates: candidates.map(candidate => candidate._id.toString()) });
  }
  return results;
}
