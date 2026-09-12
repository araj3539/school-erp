import { Request, Response, NextFunction } from "express";
import { BankTransactionImportSchema, SubmitUpiPaymentSchema, VerifyUpiPaymentSchema } from "../validators/upiPaymentValidators.js";
import { getUpiPaymentDetails, reconcileBankTransactions, settleUpiPaymentOrder, submitUpiPayment } from "../services/upiPaymentService.js";
import { AppError } from "../utils/errors.js";

function schoolId(req: Request): string {
  if (!req.user?.schoolId) throw AppError.forbidden("A school context is required for payment operations");
  return req.user.schoolId;
}

export async function getUpiPayment(req: Request, res: Response, next: NextFunction) {
  try { res.json(await getUpiPaymentDetails(schoolId(req), req.params.id)); } catch (error) { next(error); }
}

export async function submitUpiPaymentForOrder(req: Request, res: Response, next: NextFunction) {
  try {
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
