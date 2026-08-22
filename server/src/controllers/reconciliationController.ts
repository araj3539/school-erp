import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Fee, Payment, PaymentReversal } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { DateRangeSchema } from "../validators/index.js";

export async function getFinancialReconciliation(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate } = DateRangeSchema.parse(req.query);
    const schoolId = new mongoose.Types.ObjectId(req.user!.schoolId);
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const paymentMatch: Record<string, unknown> = { schoolId };
    if (Object.keys(dateFilter).length) paymentMatch.date = dateFilter;

    const [paymentSummary, reversalSummary, feeSummary, mismatches] = await Promise.all([
      Payment.aggregate([
        { $match: paymentMatch },
        { $group: { _id: null, count: { $sum: 1 }, grossCollected: { $sum: "$amount" } } },
      ]),
      PaymentReversal.aggregate([
        { $match: { schoolId, ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}) } },
        { $group: { _id: null, count: { $sum: 1 }, reversedAmount: { $sum: "$amount" } } },
      ]),
      Fee.aggregate([
        { $match: { schoolId } },
        { $group: { _id: null, totalDue: { $sum: "$totalDue" }, recordedPaid: { $sum: "$paidAmount" }, recordedBalance: { $sum: "$balance" } } },
      ]),
      Fee.aggregate([
        { $match: { schoolId } },
        {
          $lookup: {
            from: "payments",
            let: { feeId: "$_id" },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ["$feeId", "$$feeId"] }, { $eq: ["$schoolId", schoolId] }] } } },
              { $group: { _id: null, gross: { $sum: "$amount" } } },
            ],
            as: "payments",
          },
        },
        {
          $lookup: {
            from: "paymentreversals",
            let: { paymentFeeId: "$_id" },
            pipeline: [
              { $lookup: { from: "payments", localField: "paymentId", foreignField: "_id", as: "payment" } },
              { $unwind: "$payment" },
              { $match: { $expr: { $and: [{ $eq: ["$payment.feeId", "$$paymentFeeId"] }, { $eq: ["$schoolId", schoolId] }] } } },
              { $group: { _id: null, reversed: { $sum: "$amount" } } },
            ],
            as: "reversals",
          },
        },
        {
          $project: {
            _id: 1,
            studentId: 1,
            totalDue: 1,
            recordedPaid: "$paidAmount",
            grossPayments: { $ifNull: [{ $arrayElemAt: ["$payments.gross", 0] }, 0] },
            reversals: { $ifNull: [{ $arrayElemAt: ["$reversals.reversed", 0] }, 0] },
          },
        },
        { $addFields: { netPayments: { $subtract: ["$grossPayments", "$reversals"] } } },
        { $addFields: { variance: { $subtract: ["$recordedPaid", "$netPayments"] } } },
        { $match: { $expr: { $gt: [{ $abs: "$variance" }, 0.01] } } },
        { $limit: 100 },
      ]),
    ]);

    const grossCollected = paymentSummary[0]?.grossCollected ?? 0;
    const reversedAmount = reversalSummary[0]?.reversedAmount ?? 0;
    const netCollected = grossCollected - reversedAmount;
    const recordedPaid = feeSummary[0]?.recordedPaid ?? 0;

    res.json({
      period: { startDate: startDate ?? null, endDate: endDate ?? null },
      summary: {
        paymentCount: paymentSummary[0]?.count ?? 0,
        reversalCount: reversalSummary[0]?.count ?? 0,
        grossCollected,
        reversedAmount,
        netCollected,
        recordedPaid,
        ledgerVariance: Number((recordedPaid - netCollected).toFixed(2)),
        reconciled: Math.abs(recordedPaid - netCollected) <= 0.01 && mismatches.length === 0,
      },
      feeSummary: {
        totalDue: feeSummary[0]?.totalDue ?? 0,
        recordedPaid,
        recordedBalance: feeSummary[0]?.recordedBalance ?? 0,
      },
      mismatches,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) return next(AppError.badRequest("Invalid reconciliation date or identifier"));
    next(error);
  }
}
