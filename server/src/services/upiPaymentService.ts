import mongoose from "mongoose";
import { Fee, Payment, PaymentOrder, School, User } from "../models/index.js";
import { FeeStatus, PaymentMode, generateReceiptNumber } from "@school-erp/shared";
import { createAuditLog } from "./auditLog.js";
import { enqueuePaymentNotification } from "./notificationService.js";
import { AppError } from "../utils/errors.js";

function paymentSettings(school: any): { upiVpa: string; upiName: string } {
  const settings = (school?.settings?.payments || {}) as Record<string, unknown>;
  const upiVpa = String(settings.upiVpa || "").trim();
  const upiName = String(settings.upiName || school?.name || "School").trim();
  if (!upiVpa) throw AppError.conflict("School UPI payment configuration is not available");
  if (!/^[A-Za-z0-9._-]+@[A-Za-z0-9._-]+$/.test(upiVpa)) throw AppError.conflict("School UPI VPA configuration is invalid");
  return { upiVpa, upiName };
}

export function buildUpiPaymentLink(input: { vpa: string; name: string; amount: number; reference: string; note?: string }): string {
  const params = new URLSearchParams({ pa: input.vpa, pn: input.name, am: input.amount.toFixed(2), cu: "INR", tr: input.reference, tn: input.note || `Fee payment ${input.reference}` });
  return `upi://pay?${params.toString()}`;
}

export async function getUpiPaymentDetails(schoolId: string, orderId: string) {
  const [school, order] = await Promise.all([
    School.findById(schoolId).select("name settings").lean(),
    PaymentOrder.findOne({ _id: orderId, schoolId }).populate("feeId").lean(),
  ]);
  if (!school) throw AppError.notFound("School not found");
  if (!order) throw AppError.notFound("Payment order not found");
  if (["paid", "cancelled", "expired", "refunded"].includes(order.status)) throw AppError.conflict("This payment order is no longer payable");
  const { upiVpa, upiName } = paymentSettings(school);
  const upiUrl = buildUpiPaymentLink({ vpa: upiVpa, name: upiName, amount: order.amount, reference: order._id.toString(), note: `School fee ${order._id.toString().slice(-8).toUpperCase()}` });
  return { order, payee: { upiVpa, name: upiName }, upiUrl, qrPayload: upiUrl };
}

export async function submitUpiPayment(schoolId: string, orderId: string, utr: string, payerUpiId?: string) {
  const order = await PaymentOrder.findOne({ _id: orderId, schoolId });
  if (!order) throw AppError.notFound("Payment order not found");
  if (!["created", "pending", "failed"].includes(order.status)) throw AppError.conflict("This payment order cannot accept a UTR");
  const existing = await PaymentOrder.findOne({ schoolId, utr: utr.toUpperCase() }).lean();
  if (existing && existing._id.toString() !== orderId) throw AppError.conflict("This UTR has already been submitted for another payment");
  order.utr = utr.toUpperCase();
  order.payerUpiId = payerUpiId?.trim().toLowerCase();
  order.submittedAt = new Date();
  order.rejectionReason = undefined;
  order.status = "pending";
  await order.save();
  await createAuditLog({ actorType: "user", schoolId, action: "UPI_PAYMENT_SUBMITTED", entity: "PaymentOrder", entityId: order._id.toString(), after: { amount: order.amount, utr: order.utr, payerUpiId: order.payerUpiId } });
  return order.toObject();
}

export async function settleUpiPaymentOrder(schoolId: string, orderId: string, verifierUserId: string, approved: boolean, reason?: string) {
  const session = await mongoose.startSession();
  try {
    let paymentId: mongoose.Types.ObjectId | undefined;
    let result: Record<string, unknown> | undefined;
    await session.withTransaction(async () => {
      const order = await PaymentOrder.findOne({ _id: orderId, schoolId }).session(session);
      if (!order) throw AppError.notFound("Payment order not found");
      if (order.status === "paid") { result = order.toObject() as unknown as Record<string, unknown>; return; }
      if (order.status !== "pending" || !order.utr) throw AppError.conflict("Payment order is not awaiting UPI verification");
      if (!approved) {
        order.status = "failed";
        order.rejectionReason = reason || "UPI payment could not be verified";
        order.verifiedAt = new Date();
        order.verifiedBy = new mongoose.Types.ObjectId(verifierUserId);
        await order.save({ session });
        await createAuditLog({ userId: verifierUserId, schoolId, action: "UPI_PAYMENT_REJECTED", entity: "PaymentOrder", entityId: order._id.toString(), after: { utr: order.utr, reason: order.rejectionReason }, session });
        result = order.toObject() as unknown as Record<string, unknown>;
        return;
      }

      const fee = await Fee.findOne({ _id: order.feeId, schoolId }).session(session);
      if (!fee) throw AppError.notFound("Fee for payment order was not found");
      if (order.amount > fee.balance) throw AppError.conflict("Payment exceeds the current fee balance; reconciliation is required");
      const duplicatePayment = await Payment.findOne({ schoolId, transactionId: order.utr }).session(session);
      if (duplicatePayment) throw AppError.conflict("This UTR is already recorded in the payment ledger");
      const payment = new Payment({ feeId: order.feeId, studentId: order.studentId, schoolId, amount: order.amount, mode: PaymentMode.UPI, transactionId: order.utr, idempotencyKey: `upi-utr:${order.utr}`, receiptNo: generateReceiptNumber(), collectedBy: new mongoose.Types.ObjectId(verifierUserId), date: new Date() });
      await payment.save({ session });
      fee.paidAmount += order.amount;
      fee.balance = Math.max(0, fee.totalDue - fee.paidAmount);
      fee.status = fee.balance === 0 ? FeeStatus.PAID : FeeStatus.PARTIAL;
      await fee.save({ session });
      order.status = "paid";
      order.verifiedAt = new Date();
      order.verifiedBy = new mongoose.Types.ObjectId(verifierUserId);
      await order.save({ session });
      await createAuditLog({ userId: verifierUserId, schoolId, action: "UPI_PAYMENT_VERIFIED", entity: "PaymentOrder", entityId: order._id.toString(), after: { paymentId: payment._id.toString(), amount: payment.amount, utr: order.utr }, session });
      await createAuditLog({ userId: verifierUserId, schoolId, action: "CREATE", entity: "Payment", entityId: payment._id.toString(), after: { amount: payment.amount, feeId: payment.feeId.toString(), mode: payment.mode, transactionId: payment.transactionId }, session });
      paymentId = payment._id;
      result = order.toObject() as unknown as Record<string, unknown>;
    });
    if (paymentId) {
      const payment = await Payment.findOne({ _id: paymentId, schoolId }).lean();
      if (payment) void enqueuePaymentNotification(payment).catch(() => undefined);
    }
    return result!;
  } finally {
    await session.endSession();
  }
}

export async function reconcileBankTransactions(schoolId: string, transactions: Array<{ utr: string; amount: number; date: string; payerUpiId?: string }>, verifierUserId: string) {
  const results: Array<Record<string, unknown>> = [];
  for (const transaction of transactions) {
    const utr = transaction.utr.trim().toUpperCase();
    const exact = await PaymentOrder.findOne({ schoolId, utr, status: "pending" }).lean();
    if (exact && Math.abs(exact.amount - transaction.amount) < 0.01) {
      await settleUpiPaymentOrder(schoolId, exact._id.toString(), verifierUserId, true);
      results.push({ utr, result: "auto_verified", orderId: exact._id.toString() });
      continue;
    }
    const date = new Date(transaction.date);
    const from = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    const to = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    const candidates = await PaymentOrder.find({ schoolId, status: "pending", amount: transaction.amount, submittedAt: { $gte: from, $lte: to }, ...(transaction.payerUpiId ? { payerUpiId: transaction.payerUpiId.trim().toLowerCase() } : {}) }).select("_id amount utr").lean();
    if (candidates.length === 1) {
      await settleUpiPaymentOrder(schoolId, candidates[0]._id.toString(), verifierUserId, true);
      results.push({ utr, result: "auto_verified_by_amount_date", orderId: candidates[0]._id.toString() });
    } else {
      results.push({ utr, result: candidates.length === 0 ? "unmatched" : "ambiguous", candidates: candidates.map((candidate) => candidate._id.toString()) });
    }
  }
  return results;
}
