import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Fee, Payment, PaymentReversal } from "../models/index.js";
import { PaymentQuerySchema, CreatePaymentSchema, PaymentReversalSchema } from "../validators/index.js";
import { createAuditLog } from "../services/auditLog.js";
import { generateReceiptNumber } from "@school-erp/shared";
import { generateReceiptPDF } from "../services/pdf.js";
import { AppError } from "../utils/errors.js";

function schoolId(req: Request): string { return req.user!.schoolId; }

function samePaymentRequest(payment: any, data: any): boolean {
  return payment.feeId.toString() === data.feeId
    && payment.amount === data.amount
    && payment.mode === data.mode
    && (payment.transactionId || undefined) === (data.transactionId || undefined);
}

export async function collectPayment(req: Request, res: Response, next: NextFunction) {
  const session = await mongoose.startSession();
  const tenant = schoolId(req);
  try {
    const raw = { ...req.body };
    const headerKey = req.get("Idempotency-Key")?.trim();
    if (!raw.idempotencyKey && headerKey) raw.idempotencyKey = headerKey;
    const data = CreatePaymentSchema.parse(raw);

    if (data.idempotencyKey) {
      const existing = await Payment.findOne({ schoolId: tenant, idempotencyKey: data.idempotencyKey }).lean();
      if (existing) {
        if (!samePaymentRequest(existing, data)) throw AppError.conflict("Idempotency key was already used for a different payment");
        return res.status(200).json({ payment: existing, idempotentReplay: true });
      }
    }

    let paymentId: mongoose.Types.ObjectId | undefined;
    await session.withTransaction(async () => {
      const fee = await Fee.findOne({ _id: data.feeId, schoolId: tenant }).session(session);
      if (!fee) throw AppError.notFound("Fee not found");
      if (data.amount > fee.balance) throw AppError.badRequest("Payment amount exceeds balance");
      if (fee.balance <= 0) throw AppError.badRequest("Fee has no outstanding balance");

      const studentId = fee.studentId;
      const payment = new Payment({
        ...data,
        schoolId: tenant,
        studentId,
        receiptNo: generateReceiptNumber(),
        collectedBy: new mongoose.Types.ObjectId(req.user!.userId),
        date: new Date(),
      });
      await payment.save({ session });

      fee.paidAmount += data.amount;
      fee.balance = Math.max(0, fee.totalDue - fee.paidAmount);
      fee.status = fee.balance === 0 ? "paid" : "partial";
      await fee.save({ session });

      await createAuditLog({
        userId: req.user!.userId,
        schoolId: tenant,
        action: "CREATE",
        entity: "Payment",
        entityId: payment._id.toString(),
        after: { amount: data.amount, feeId: data.feeId, mode: data.mode, receiptNo: payment.receiptNo, idempotencyKey: data.idempotencyKey },
        session,
      });
      paymentId = payment._id;
    });

    const payment = await Payment.findOne({ _id: paymentId!, schoolId: tenant }).populate("collectedBy").lean();
    if (!payment) throw AppError.notFound("Payment not found after collection");
    const fee = await Fee.findOne({ _id: payment.feeId, schoolId: tenant }).populate("feeStructureId studentId").lean();
    if (!fee) throw AppError.notFound("Fee not found after collection");
    const receiptPdf = await generateReceiptPDF({ ...payment, fee: { ...fee, feeStructure: fee.feeStructureId, student: fee.studentId }, collectedBy: { fullName: req.user!.email } } as any);
    res.status(201).json({ payment, receiptPdf: receiptPdf.toString("base64") });
  } catch (error: any) {
    if (error?.code === 11000) {
      const key = req.get("Idempotency-Key")?.trim();
      if (key) {
        const existing = await Payment.findOne({ schoolId: tenant, idempotencyKey: key }).lean();
        if (existing) return res.status(200).json({ payment: existing, idempotentReplay: true });
      }
    }
    next(error);
  } finally {
    await session.endSession();
  }
}

export async function reversePayment(req: Request, res: Response, next: NextFunction) {
  const session = await mongoose.startSession();
  const tenant = schoolId(req);
  try {
    const { id } = req.validatedParams as { id: string };
    const data = PaymentReversalSchema.parse(req.body);
    let reversalId: mongoose.Types.ObjectId | undefined;

    await session.withTransaction(async () => {
      const payment = await Payment.findOne({ _id: id, schoolId: tenant }).session(session);
      if (!payment) throw AppError.notFound("Payment not found");

      const previous = await PaymentReversal.aggregate([
        { $match: { paymentId: payment._id, schoolId: new mongoose.Types.ObjectId(tenant) } },
        { $group: { _id: null, amount: { $sum: "$amount" } } },
      ]).session(session);
      const alreadyReversed = previous[0]?.amount ?? 0;
      if (alreadyReversed + data.amount > payment.amount) throw AppError.badRequest("Reversal/refund exceeds remaining payment amount");

      const reversal = new PaymentReversal({
        paymentId: payment._id,
        schoolId: tenant,
        amount: data.amount,
        type: data.type,
        reason: data.reason,
        createdBy: new mongoose.Types.ObjectId(req.user!.userId),
      });
      await reversal.save({ session });

      const fee = await Fee.findOne({ _id: payment.feeId, schoolId: tenant }).session(session);
      if (!fee) throw AppError.notFound("Fee not found");
      fee.paidAmount = Math.max(0, fee.paidAmount - data.amount);
      fee.balance = Math.max(0, fee.totalDue - fee.paidAmount);
      fee.status = fee.balance === 0 ? "paid" : fee.paidAmount > 0 ? "partial" : "pending";
      await fee.save({ session });

      await createAuditLog({
        userId: req.user!.userId,
        schoolId: tenant,
        action: data.type === "refund" ? "REFUND_PAYMENT" : "REVERSE_PAYMENT",
        entity: "Payment",
        entityId: payment._id.toString(),
        before: { paidAmount: fee.paidAmount + data.amount, balance: fee.balance - data.amount },
        after: { reversalId: reversal._id.toString(), amount: data.amount, reason: data.reason, type: data.type, feeId: fee._id.toString() },
        session,
      });
      reversalId = reversal._id;
    });

    const reversal = await PaymentReversal.findOne({ _id: reversalId!, schoolId: tenant }).lean();
    res.status(201).json({ reversal });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
}

export async function getPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const query = PaymentQuerySchema.parse(req.query);
    const { page = 1, limit = 20, sortBy, sortOrder, ...filters } = query;
    const dbQuery: Record<string, unknown> = { schoolId: tenantId(req) };
    if (filters.studentId) dbQuery.studentId = filters.studentId;
    if (filters.feeId) dbQuery.feeId = filters.feeId;
    if (filters.startDate || filters.endDate) {
      dbQuery.date = {};
      if (filters.startDate) (dbQuery.date as any).$gte = new Date(filters.startDate as string);
      if (filters.endDate) (dbQuery.date as any).$lte = new Date(filters.endDate as string);
    }
    const sort: Record<string, 1 | -1> = {};
    if (sortBy) sort[sortBy] = sortOrder === "asc" ? 1 : -1; else sort.date = -1;
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      Payment.find(dbQuery).populate("feeId studentId collectedBy").sort(sort).skip(skip).limit(limit).lean(),
      Payment.countDocuments(dbQuery),
    ]);
    res.json({ data: payments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

export async function getReceiptPDF(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const payment = await Payment.findOne({ _id: id, schoolId: tenantId(req) }).populate({ path: "feeId", populate: { path: "feeStructureId studentId" } }).lean();
    if (!payment) throw AppError.notFound("Payment not found");
    const pdf = await generateReceiptPDF({ ...payment, fee: { ...(payment.feeId as any), feeStructure: (payment.feeId as any).feeStructureId, student: (payment.feeId as any).studentId }, collectedBy: { fullName: (payment.collectedBy as any)?.email || "Unknown" } } as any);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=receipt-${payment.receiptNo}.pdf`);
    res.send(pdf);
  } catch (error) { next(error); }
}

function tenantId(req: Request): string { return req.user!.schoolId; }
