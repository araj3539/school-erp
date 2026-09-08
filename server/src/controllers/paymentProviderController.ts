import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { PaymentOrder, Payment, PaymentReversal } from "../models/index.js";
import { createRazorpayOrder, createRazorpayRefund, fetchRazorpayPayment, isRazorpayConfigured, verifyRazorpayCheckoutSignature } from "../services/paymentProvider.js";
import { AppError } from "../utils/errors.js";

function tenant(req: Request): string { if (!req.user?.schoolId) throw AppError.forbidden("A school context is required for payment operations"); return req.user.schoolId; }

export async function initializeProviderOrder(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isRazorpayConfigured()) throw AppError.serviceUnavailable("Online payment provider is not configured");
    const order = await PaymentOrder.findOne({ _id: req.validatedParams.id, schoolId: tenant(req) });
    if (!order) throw AppError.notFound("Payment order not found");
    if (order.providerOrderId) return res.json({ order, provider: "razorpay", idempotentReplay: true });
    if (!["created", "pending"].includes(order.status)) throw AppError.conflict(`Payment order cannot be initialized from status ${order.status}`);
    const providerOrder = await createRazorpayOrder({ amount: order.amount, currency: order.currency, receipt: order._id.toString(), notes: { schoolId: order.schoolId.toString(), feeId: order.feeId.toString(), paymentOrderId: order._id.toString() } });
    order.provider = "razorpay";
    order.providerOrderId = providerOrder.id;
    order.status = "pending";
    await order.save();
    res.status(200).json({ order, providerOrder: { id: providerOrder.id, amount: providerOrder.amount, currency: providerOrder.currency, keyId: process.env.RAZORPAY_KEY_ID } });
  } catch (error) { next(error); }
}

export async function verifyProviderPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { paymentId, signature } = req.body as { paymentId?: string; signature?: string };
    const order = await PaymentOrder.findOne({ _id: req.validatedParams.id, schoolId: tenant(req) });
    if (!order || order.provider !== "razorpay" || !order.providerOrderId) throw AppError.notFound("Provider payment order not found");
    if (!paymentId || !signature || !verifyRazorpayCheckoutSignature({ orderId: order.providerOrderId, paymentId, signature })) throw AppError.unauthorized("Invalid payment signature");
    const providerPayment = await fetchRazorpayPayment(paymentId);
    if (providerPayment.order_id !== order.providerOrderId || providerPayment.amount !== Math.round(order.amount * 100) || providerPayment.status !== "captured") throw AppError.conflict("Provider payment is not captured for this payment order");
    res.json({ verified: true, providerPayment: { id: providerPayment.id, status: providerPayment.status, orderId: providerPayment.order_id } });
  } catch (error) { next(error); }
}

export async function requestProviderRefund(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isRazorpayConfigured()) throw AppError.serviceUnavailable("Online payment provider is not configured");
    const order = await PaymentOrder.findOne({ _id: req.validatedParams.id, schoolId: tenant(req) });
    if (!order?.providerPaymentId || order.provider !== "razorpay") throw AppError.notFound("Captured provider payment not found");
    if (!req.body?.amount || req.body.amount <= 0) throw AppError.badRequest("Refund amount must be greater than zero");
    const payment = await Payment.findOne({ schoolId: tenant(req), transactionId: order.providerPaymentId });
    if (!payment) throw AppError.notFound("Ledger payment not found");
    const prior = await PaymentReversal.aggregate([{ $match: { schoolId: new mongoose.Types.ObjectId(tenant(req)), paymentId: payment._id } }, { $group: { _id: null, amount: { $sum: "$amount" } } }]);
    const alreadyRefunded = prior[0]?.amount ?? 0;
    if (req.body.amount > payment.amount - alreadyRefunded) throw AppError.badRequest("Refund exceeds the remaining refundable amount");
    const refund = await createRazorpayRefund({ paymentId: order.providerPaymentId, amount: req.body.amount, idempotencyKey: `refund-${order._id}-${Date.now()}`, receipt: `refund-${payment.receiptNo}` });
    res.status(202).json({ refund, message: "Refund initiated; authoritative fee/ledger reversal is applied from the verified provider webhook." });
  } catch (error) { next(error); }
}
