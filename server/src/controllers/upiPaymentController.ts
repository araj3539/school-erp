import { Request, Response, NextFunction } from "express";
import { UserRole } from "@school-erp/shared";
import { PaymentOrder, Student } from "../models/index.js";
import { BankTransactionImportSchema, SubmitUpiPaymentSchema, VerifyUpiPaymentSchema } from "../validators/upiPaymentValidators.js";
import { getUpiPaymentDetails, reconcileBankTransactions, settleUpiPaymentOrder, submitUpiPayment } from "../services/upiPaymentService.js";
import { AppError } from "../utils/errors.js";

function schoolId(req: Request): string {
  if (!req.user?.schoolId) throw AppError.forbidden("A school context is required for payment operations");
  return req.user.schoolId;
}

async function assertOrderOwnership(req: Request, orderId: string): Promise<void> {
  const user = req.user!;
  if (user.role !== UserRole.STUDENT && user.role !== UserRole.PARENT) return;
  const order = await PaymentOrder.findOne({ _id: orderId, schoolId: schoolId(req) }).select("studentId").lean();
  if (!order) throw AppError.notFound("Payment order not found");
  const student = await Student.findOne({ _id: order.studentId, schoolId: schoolId(req) }).select("userId parentIds").lean();
  if (!student) throw AppError.notFound("Student not found");
  if (user.role === UserRole.STUDENT && student.userId?.toString() !== user.userId) throw AppError.forbidden("Students can only access their own payment orders");
  if (user.role === UserRole.PARENT && !student.parentIds.some((id) => id.toString() === user.userId)) throw AppError.forbidden("Parents can only access payment orders for linked children");
}

export async function getUpiPayment(req: Request, res: Response, next: NextFunction) {
  try { await assertOrderOwnership(req, req.params.id); res.json(await getUpiPaymentDetails(schoolId(req), req.params.id)); } catch (error) { next(error); }
}

export async function submitUpiPaymentForOrder(req: Request, res: Response, next: NextFunction) {
  try {
    await assertOrderOwnership(req, req.params.id);
    const data = SubmitUpiPaymentSchema.parse(req.body);
    const order = await submitUpiPayment(schoolId(req), req.params.id, data.utr, data.payerUpiId);
    res.status(202).json({ order, message: "UPI payment submitted for verification" });
  } catch (error) { next(error); }
}

export async function verifyUpiPaymentForOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const data = VerifyUpiPaymentSchema.parse(req.body);
    const order = await settleUpiPaymentOrder(schoolId(req), req.params.id, req.user!.userId, data.approved, data.reason);
    res.json({ order });
  } catch (error) { next(error); }
}

export async function importBankTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const data = BankTransactionImportSchema.parse(req.body);
    const results = await reconcileBankTransactions(schoolId(req), data.transactions, req.user!.userId);
    res.json({ results, summary: { imported: data.transactions.length, autoVerified: results.filter((r) => String(r.result).startsWith("auto_verified")).length, unmatched: results.filter((r) => r.result === "unmatched").length, ambiguous: results.filter((r) => r.result === "ambiguous").length } });
  } catch (error) { next(error); }
}
