import { Request, Response } from "express";
import mongoose from "mongoose";
import { Fee, Payment, PaymentOrder, PaymentReversal, PaymentWebhookEvent } from "../models/index.js";
import { FeeStatus, PaymentMode, generateReceiptNumber } from "@school-erp/shared";
import { createAuditLog } from "../services/auditLog.js";
import { applyRazorpaySubscriptionWebhook } from "../services/billing.js";
import { assertPaymentOrderTransition } from "../services/paymentOrderStateMachine.js";
import { verifyRazorpayWebhookSignature } from "../services/paymentProvider.js";
import { AppError } from "../utils/errors.js";

type RawBodyRequest = Request & { rawBody?: Buffer };
const PROCESSING_LEASE_MS = 5 * 60 * 1000;

function providerEventId(req: Request): string { return req.get("x-razorpay-event-id")?.trim() || ""; }
function eventEntity(body: any, key: string): any { return body?.payload?.[key]?.entity; }

async function applyCapturedPayment(body: any, session: mongoose.ClientSession): Promise<mongoose.Types.ObjectId | undefined> {
  const providerOrderId = eventEntity(body, "order")?.id || eventEntity(body, "payment")?.order_id;
  const providerPaymentId = eventEntity(body, "payment")?.id;
  if (!providerOrderId || !providerPaymentId) return undefined;
  const order = await PaymentOrder.findOne({ provider: "razorpay", providerOrderId }).session(session);
  if (!order) throw AppError.notFound("Payment order for provider event was not found");
  const paymentEntity = eventEntity(body, "payment");
  const amount = Number(paymentEntity?.amount || 0) / 100;
  if (amount !== order.amount) throw AppError.conflict("Provider payment amount does not match the authoritative payment order");
  if (["paid", "partially_refunded", "refunded"].includes(order.status)) return order._id;
  if (order.status === "created") { assertPaymentOrderTransition(order.status, "pending"); order.status = "pending"; }
  assertPaymentOrderTransition(order.status, "paid");

  const existingPayment = await Payment.findOne({ schoolId: order.schoolId, transactionId: providerPaymentId }).session(session).lean();
  if (!existingPayment) {
    const fee = await Fee.findOne({ _id: order.feeId, schoolId: order.schoolId }).session(session);
    if (!fee) throw AppError.notFound("Fee for payment order was not found");
    const updated = await Fee.updateOne({ _id: fee._id, schoolId: order.schoolId, balance: { $gte: order.amount } }, { $inc: { paidAmount: order.amount, balance: -order.amount } }, { session });
    if (updated.modifiedCount !== 1) throw AppError.conflict("Fee balance changed before provider payment was applied; reconciliation is required");
    const refreshedFee = await Fee.findById(fee._id).session(session);
    if (!refreshedFee) throw AppError.notFound("Fee disappeared during payment application");
    refreshedFee.status = refreshedFee.balance === 0 ? FeeStatus.PAID : FeeStatus.PARTIAL;
    await refreshedFee.save({ session });
    const payment = new Payment({ feeId: order.feeId, studentId: order.studentId, schoolId: order.schoolId, amount: order.amount, mode: PaymentMode.ONLINE, transactionId: providerPaymentId, idempotencyKey: `razorpay:${providerPaymentId}`, receiptNo: generateReceiptNumber(), collectedBy: order.createdBy, date: new Date() });
    await payment.save({ session });
    await createAuditLog({ userId: order.createdBy.toString(), schoolId: order.schoolId.toString(), action: "CREATE", entity: "Payment", entityId: payment._id.toString(), after: { amount: payment.amount, mode: payment.mode, provider: "razorpay", providerPaymentId }, session });
  }
  order.providerPaymentId = providerPaymentId;
  order.status = "paid";
  await order.save({ session });
  return order._id;
}

async function applyRefund(body: any, session: mongoose.ClientSession): Promise<mongoose.Types.ObjectId | undefined> {
  const refund = eventEntity(body, "refund");
  const providerPaymentId = refund?.payment_id;
  if (!refund?.id || !providerPaymentId) return undefined;
  const payment = await Payment.findOne({ transactionId: providerPaymentId }).session(session);
  if (!payment) throw AppError.notFound("Payment for provider refund was not found");
  const alreadyApplied = await PaymentReversal.findOne({ schoolId: payment.schoolId, providerRefundId: refund.id }).session(session);
  if (alreadyApplied) return payment._id;
  const amount = Number(refund.amount || 0) / 100;
  if (amount <= 0) throw AppError.badRequest("Provider refund amount must be positive");
  const previous = await PaymentReversal.aggregate([{ $match: { paymentId: payment._id, schoolId: payment.schoolId } }, { $group: { _id: null, amount: { $sum: "$amount" } } }]).session(session);
  const alreadyReversed = previous[0]?.amount ?? 0;
  if (amount > payment.amount - alreadyReversed) throw AppError.conflict("Provider refund exceeds the remaining refundable payment amount");
  const reversal = new PaymentReversal({ paymentId: payment._id, schoolId: payment.schoolId, amount, type: "refund", reason: `Razorpay refund ${refund.id}`, providerRefundId: refund.id, createdBy: payment.collectedBy });
  await reversal.save({ session });
  const fee = await Fee.findOne({ _id: payment.feeId, schoolId: payment.schoolId }).session(session);
  if (!fee) throw AppError.notFound("Fee for refunded payment was not found");
  fee.paidAmount = Math.max(0, fee.paidAmount - amount);
  fee.balance = Math.max(0, fee.totalDue - fee.paidAmount);
  fee.status = fee.balance === 0 ? FeeStatus.PAID : fee.paidAmount > 0 ? FeeStatus.PARTIAL : FeeStatus.PENDING;
  await fee.save({ session });
  const order = await PaymentOrder.findOne({ schoolId: payment.schoolId, providerPaymentId }).session(session);
  if (order) { order.status = amount + alreadyReversed >= payment.amount ? "refunded" : "partially_refunded"; await order.save({ session }); }
  await createAuditLog({ userId: payment.collectedBy.toString(), schoolId: payment.schoolId.toString(), action: "REFUND_PAYMENT", entity: "Payment", entityId: payment._id.toString(), after: { amount, providerRefundId: refund.id, feeId: fee._id.toString() }, session });
  return payment._id;
}

async function claimWebhookEvent(provider: string, eventId: string, eventType: string) {
  const now = new Date();
  try {
    return await PaymentWebhookEvent.create({ provider, eventId, eventType, status: "received", processingAt: now });
  } catch (error: any) {
    if (error?.code !== 11000) throw error;
    const existing = await PaymentWebhookEvent.findOne({ provider, eventId });
    if (!existing) throw error;
    if (["processed", "ignored"].includes(existing.status)) return null;
    if (existing.status === "failed" || (existing.status === "received" && (!existing.processingAt || now.getTime() - existing.processingAt.getTime() >= PROCESSING_LEASE_MS))) {
      return PaymentWebhookEvent.findOneAndUpdate(
        { _id: existing._id, $or: [{ status: "failed" }, { status: "received", processingAt: { $lte: new Date(now.getTime() - PROCESSING_LEASE_MS) } }, { status: "received", processingAt: null }] },
        { $set: { status: "received", processingAt: now }, $unset: { errorMessage: 1, processedAt: 1 } },
        { new: true },
      );
    }
    return null;
  }
}

export async function handleRazorpayWebhook(req: RawBodyRequest, res: Response): Promise<void> {
  const signature = req.get("x-razorpay-signature") || "";
  const rawBody = req.rawBody;
  if (!rawBody || !signature || !verifyRazorpayWebhookSignature(rawBody, signature)) { res.status(401).json({ message: "Invalid payment provider signature" }); return; }
  const eventId = providerEventId(req);
  if (!eventId) { res.status(400).json({ message: "Missing provider event id" }); return; }
  let body: any;
  try { body = JSON.parse(rawBody.toString("utf8")); } catch { res.status(400).json({ message: "Invalid webhook JSON" }); return; }
  const eventType = String(body?.event || "unknown");
  const event = await claimWebhookEvent("razorpay", eventId, eventType);
  if (!event) { res.status(200).json({ received: true, duplicate: true }); return; }

  const session = await mongoose.startSession();
  try {
    let paymentOrderId: mongoose.Types.ObjectId | undefined;
    let subscriptionId: mongoose.Types.ObjectId | undefined;
    const supportedSubscriptionEvent = ["subscription.authenticated", "subscription.activated", "subscription.charged", "subscription.completed", "subscription.expired", "subscription.updated", "subscription.pending", "subscription.halted", "subscription.paused", "subscription.resumed", "subscription.cancelled"].includes(eventType);
    await session.withTransaction(async () => {
      if (["order.paid", "payment.captured"].includes(eventType)) paymentOrderId = await applyCapturedPayment(body, session);
      else if (eventType === "refund.processed") await applyRefund(body, session);
      else if (["payment.failed", "order.expired"].includes(eventType)) {
        const providerOrderId = eventEntity(body, "order")?.id || eventEntity(body, "payment")?.order_id;
        if (providerOrderId) {
          const order = await PaymentOrder.findOne({ provider: "razorpay", providerOrderId }).session(session);
          if (order && order.status === "pending") { const target = eventType === "payment.failed" ? "failed" : "expired"; assertPaymentOrderTransition(order.status, target); order.status = target; await order.save({ session }); paymentOrderId = order._id; }
        }
      } else if (supportedSubscriptionEvent) {
        subscriptionId = await applyRazorpaySubscriptionWebhook(body, eventType, session);
      }

      event.status = supportedSubscriptionEvent || ["order.paid", "payment.captured", "refund.processed", "payment.failed", "order.expired"].includes(eventType) ? "processed" : "ignored";
      event.processedAt = new Date();
      event.processingAt = undefined;
      event.paymentOrderId = paymentOrderId;
      event.subscriptionId = subscriptionId;
      await event.save({ session });
    });
    res.status(200).json({ received: true });
  } catch (error: any) {
    event.status = "failed";
    event.processingAt = undefined;
    event.errorMessage = String(error?.message || "Webhook processing failed").slice(0, 500);
    await event.save().catch(() => undefined);
    throw error;
  } finally { await session.endSession(); }
}
