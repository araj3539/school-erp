import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Fee, PaymentOrder, Student } from "../models/index.js";
import { UserRole } from "@school-erp/shared";
import { AppError } from "../utils/errors.js";
import { CreatePaymentOrderSchema } from "../validators/paymentOrderValidators.js";

function schoolId(req: Request): string {
  const tenant = req.user?.schoolId;
  if (!tenant) throw AppError.forbidden("A school context is required for payment operations");
  return tenant;
}

async function assertFeeOwnership(req: Request, studentId: mongoose.Types.ObjectId): Promise<void> {
  if (!req.user) throw AppError.unauthorized("Authentication required");
  if (req.user.role !== UserRole.STUDENT && req.user.role !== UserRole.PARENT) return;

  const student = await Student.findOne({ _id: studentId, schoolId: schoolId(req) })
    .select("userId parentIds")
    .lean();
  if (!student) throw AppError.notFound("Student not found");

  if (req.user.role === UserRole.STUDENT && student.userId?.toString() !== req.user.userId) {
    throw AppError.forbidden("Students can only create payment orders for their own fees");
  }
  if (req.user.role === UserRole.PARENT && !student.parentIds.some((id) => id.toString() === req.user!.userId)) {
    throw AppError.forbidden("Parents can only create payment orders for linked children");
  }
}

function sameOrderRequest(order: any, data: { feeId: string; amount: number; currency: string }): boolean {
  return order.feeId.toString() === data.feeId && order.amount === data.amount && order.currency === data.currency;
}

export async function createPaymentOrder(req: Request, res: Response, next: NextFunction) {
  const tenant = schoolId(req);
  try {
    const data = CreatePaymentOrderSchema.parse(req.body);
    const existing = await PaymentOrder.findOne({ schoolId: tenant, idempotencyKey: data.idempotencyKey }).lean();
    if (existing) {
      if (!sameOrderRequest(existing, data)) {
        throw AppError.conflict("Idempotency key was already used for a different payment order");
      }
      return res.status(200).json({ order: existing, idempotentReplay: true });
    }

    const fee = await Fee.findOne({ _id: data.feeId, schoolId: tenant }).select("studentId balance").lean();
    if (!fee) throw AppError.notFound("Fee not found");
    await assertFeeOwnership(req, fee.studentId);
    if (fee.balance <= 0) throw AppError.badRequest("Fee has no outstanding balance");
    if (data.amount > fee.balance) throw AppError.badRequest("Payment amount exceeds current outstanding balance");

    const order = await PaymentOrder.create({
      schoolId: tenant,
      feeId: fee._id,
      studentId: fee.studentId,
      amount: data.amount,
      currency: data.currency,
      idempotencyKey: data.idempotencyKey,
      status: "created",
      createdBy: new mongoose.Types.ObjectId(req.user!.userId)
    });

    return res.status(201).json({ order });
  } catch (error: any) {
    if (error?.code === 11000) {
      const data = CreatePaymentOrderSchema.safeParse(req.body);
      if (data.success) {
        const existing = await PaymentOrder.findOne({ schoolId: tenant, idempotencyKey: data.data.idempotencyKey }).lean();
        if (existing) {
          if (!sameOrderRequest(existing, data.data)) {
            return next(AppError.conflict("Idempotency key was already used for a different payment order"));
          }
          return res.status(200).json({ order: existing, idempotentReplay: true });
        }
      }
    }
    return next(error);
  }
}
