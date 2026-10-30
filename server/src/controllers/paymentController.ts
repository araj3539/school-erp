import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Fee, Payment, PaymentReversal, School } from "../models/index.js";
import { PaymentQuerySchema, CreatePaymentSchema, PaymentReversalSchema } from "../validators/index.js";
import { createAuditLog } from "../services/auditLog.js";
import { enqueuePaymentNotification } from "../services/notificationService.js";
import { allocatePaymentToItems, reversePaymentAllocations } from "../services/paymentAllocationService.js";
import { FeeStatus, generateReceiptNumber } from "@school-erp/shared";
import { generateReceiptPDF, getReceiptFilename } from "../services/pdf.js";
import { AppError } from "../utils/errors.js";
import { rangeStartFor, rangeEndFilterFor } from "../utils/dateFilter.js";
function money(value: number): number { return Math.round((value ?? 0) * 100) / 100; }
const PAID_EPSILON = 0.009;
function schoolId(req: Request): string { const tenant = req.user?.schoolId; if (!tenant) throw AppError.forbidden("A school context is required for payment operations"); return tenant; }
function samePaymentRequest(payment: any, data: any): boolean { return payment.feeId.toString() === data.feeId && payment.amount === data.amount && payment.mode === data.mode && (payment.transactionId || undefined) === (data.transactionId || undefined); }
export function getRemainingReversibleAmount(paymentAmount: number, alreadyReversed: number, requestedAmount: number): number { const remaining = paymentAmount - alreadyReversed; if (requestedAmount <= 0 || requestedAmount > remaining) throw AppError.badRequest("Reversal/refund exceeds remaining payment amount"); return remaining - requestedAmount; }
export async function collectPayment(req: Request, res: Response, next: NextFunction) {
  const session = await mongoose.startSession();
  const tenant = schoolId(req);
  try {
    const raw = { ...req.body };
    const headerKey = req.get("Idempotency-Key")?.trim();
    if (!raw.idempotencyKey && headerKey) raw.idempotencyKey = headerKey;
    const data = CreatePaymentSchema.parse(raw);
    await session.withTransaction(async () => {
      if (data.idempotencyKey) {
        const existing = await Payment.findOne({ schoolId: tenant, idempotencyKey: data.idempotencyKey }).session(session).lean();
        if (existing) {
          if (!samePaymentRequest(existing, data)) throw AppError.conflict("Idempotency key was already used for a different payment");
          return res.status(200).json({ payment: existing, idempotentReplay: true });
        }
      }
      const fee = await Fee.findOne({ _id: data.feeId, schoolId: tenant }).session(session);
      if (!fee) throw AppError.notFound("Fee not found");
      if (data.amount <= 0) throw AppError.badRequest("Payment amount must be greater than zero");
      if (data.amount > fee.balance) throw AppError.badRequest("Payment amount exceeds balance");
      if (fee.balance <= 0) throw AppError.badRequest("Fee has no outstanding balance");
      const before = { paidAmount: fee.paidAmount, balance: fee.balance, status: fee.status };
      const payment = new Payment({ feeId: data.feeId, studentId: fee.studentId.toString(), amount: data.amount, mode: data.mode, transactionId: data.transactionId, idempotencyKey: data.idempotencyKey, schoolId: tenant, receiptNo: generateReceiptNumber(), collectedBy: new mongoose.Types.ObjectId(req.user!.userId), date: new Date() });
      await payment.save({ session });
      fee.paidAmount = money(fee.paidAmount + data.amount);
      fee.balance = money(Math.max(0, fee.totalDue - fee.paidAmount));
      fee.status = fee.balance <= PAID_EPSILON ? FeeStatus.PAID : FeeStatus.PARTIAL;
      fee.stateRevision = (fee.stateRevision ?? 0) + 1;
      await fee.save({ session });
      await allocatePaymentToItems(tenant, payment._id.toString(), req.user!.userId, session);
      await createAuditLog({ userId: req.user!.userId, schoolId: tenant, action: "CREATE", entity: "Payment", entityId: payment._id.toString(), before, after: { paidAmount: fee.paidAmount, balance: fee.balance, status: fee.status }, session });
      void enqueuePaymentNotification({ ...payment as any, amount: data.amount, receiptNo: payment.receiptNo, date: payment.date, feeId: payment.feeId, studentId: payment.studentId }).catch((error) => console.error("[Payment] Failed to enqueue payment notification:", { paymentId: payment._id.toString(), error }));
      res.json({ payment });
    });
  } catch (error) {
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
    let allocationResult: any;
    await session.withTransaction(async () => {
      const payment = await Payment.findOne({ _id: id, schoolId: tenant }).session(session);
      if (!payment) throw AppError.notFound("Payment not found");
      const previous = await PaymentReversal.aggregate([{ $match: { paymentId: payment._id, schoolId: new mongoose.Types.ObjectId(tenant) } }, { $group: { _id: null, amount: { $sum: "$amount" } } }]).session(session);
      const alreadyReversed = previous[0]?.amount ?? 0;
      getRemainingReversibleAmount(payment.amount, alreadyReversed, data.amount);
      const reversal = new PaymentReversal({ paymentId: payment._id, schoolId: tenant, amount: data.amount, type: data.type, reason: data.reason, createdBy: new mongoose.Types.ObjectId(req.user!.userId) });
      await reversal.save({ session });
      reversalId = reversal._id;
      const fee = await Fee.findOne({ _id: payment.feeId, schoolId: tenant }).session(session);
      if (!fee) throw AppError.notFound("Fee not found");
      const beforePaidAmount = fee.paidAmount;
      const beforeBalance = fee.balance;
      fee.paidAmount = money(Math.max(0, fee.paidAmount - data.amount));
      fee.balance = money(Math.max(0, fee.totalDue - fee.paidAmount));
      fee.status = fee.balance <= PAID_EPSILON ? FeeStatus.PAID : fee.paidAmount > 0 ? FeeStatus.PARTIAL : FeeStatus.PENDING;
      fee.stateRevision = (fee.stateRevision ?? 0) + 1;
      await fee.save({ session });
      allocationResult = await reversePaymentAllocations(tenant, payment._id.toString(), reversal._id.toString(), data.amount, req.user!.userId, session);
      await createAuditLog({ userId: req.user!.userId, schoolId: tenant, action: data.type === "refund" ? "REFUND_PAYMENT" : "REVERSE_PAYMENT", entity: "Payment", entityId: payment._id.toString(), before: { paidAmount: beforePaidAmount, balance: beforeBalance }, after: { paidAmount: fee.paidAmount, balance: fee.balance, status: fee.status }, session });
    });
    res.json({ reversal: reversalId, amount: data.amount, allocation: allocationResult });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
}
export async function allocateExistingPayment(req: Request, res: Response, next: NextFunction) { const tenant = schoolId(req); try { const { id } = req.validatedParams as { id: string }; const result = await allocatePaymentToItems(tenant, id, req.user!.userId); res.status(200).json({ allocation: result }); } catch (error) { next(error); } }
export async function getPaymentAllocations(req: Request, res: Response, next: NextFunction) { try { const tenant = schoolId(req); const { id } = req.validatedParams as { id: string }; const allocations = await import("../models/index.js").then(({ PaymentAllocation }) => PaymentAllocation.find({ schoolId: tenant, paymentId: id }).populate("feeItemId").sort({ createdAt: 1 }).lean()); res.json({ data: allocations }); } catch (error) { next(error); } }
export async function getPayments(req: Request, res: Response, next: NextFunction) { try { const query = PaymentQuerySchema.parse(req.query); const { page = 1, limit = 20, sortBy, sortOrder, ...filters } = query; const dbQuery: Record<string, unknown> = { schoolId: schoolId(req) }; if (filters.studentId) dbQuery.studentId = filters.studentId; if (filters.feeId) dbQuery.feeId = filters.feeId; if (filters.startDate || filters.endDate) { dbQuery.date = {}; if (filters.startDate) (dbQuery.date as any).$gte = rangeStartFor(String(filters.startDate)); if (filters.endDate) Object.assign(dbQuery.date as Record<string, unknown>, rangeEndFilterFor(String(filters.endDate))); } const sort: Record<string, 1 | -1> = {}; if (sortBy) sort[sortBy] = sortOrder === "asc" ? 1 : -1; else sort.date = -1; const skip = (page - 1) * limit; const [payments, total] = await Promise.all([Payment.find(dbQuery).populate("feeId studentId collectedBy").sort(sort).skip(skip).limit(limit).lean(), Payment.countDocuments(dbQuery)]); res.json({ data: payments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }); } catch (error) { next(error); } }
export async function getReceiptPDF(req: Request, res: Response, next: NextFunction) { try { const { id } = req.validatedParams as { id: string }; const tenant = schoolId(req); const payment = await Payment.findOne({ _id: id, schoolId: tenant }).populate({ path: "feeId", populate: { path: "feeStructureId studentId" } }).lean(); if (!payment) throw AppError.notFound("Payment not found"); const school = await School.findOne({ _id: tenant }).select("name address phone email").lean(); if (!school) throw AppError.notFound("School not found"); const pdf = await generateReceiptPDF({ ...payment, fee: { ...(payment.feeId as any), feeStructure: (payment.feeId as any).feeStructureId, student: (payment.feeId as any).studentId }, collectedBy: { fullName: (payment.collectedBy as any)?.email || "Unknown" }, school } as any); res.setHeader("Content-Type", "application/pdf"); res.setHeader("Content-Disposition", `attachment; filename=${getReceiptFilename(payment.receiptNo)}`); res.send(pdf); } catch (error) { next(error); } }
