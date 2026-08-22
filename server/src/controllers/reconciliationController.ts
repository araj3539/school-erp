import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Fee, Payment, PaymentReversal } from "../models/index.js";
import { DateRangeSchema } from "../validators/index.js";

export async function getFinancialReconciliation(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate } = DateRangeSchema.parse(req.query);
    const schoolId = new mongoose.Types.ObjectId(req.user!.schoolId);
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    const periodPaymentsFilter: Record<string, unknown> = { schoolId };
    const periodReversalsFilter: Record<string, unknown> = { schoolId };
    if (Object.keys(dateFilter).length) {
      periodPaymentsFilter.date = dateFilter;
      periodReversalsFilter.createdAt = dateFilter;
    }

    const [ledgerPayments, ledgerReversals, periodPayments, periodReversals, feeSummary, mismatches] = await Promise.all([
      Payment.aggregate([{ $match: { schoolId } }, { $group: { _id: null, count: { $sum: 1 }, grossCollected: { $sum: "$amount" } } }]),
      PaymentReversal.aggregate([{ $match: { schoolId } }, { $group: { _id: null, count: { $sum: 1 }, reversedAmount: { $sum: "$amount" } } }]),
      Payment.aggregate([{ $match: periodPaymentsFilter }, { $group: { _id: null, count: { $sum: 1 }, grossCollected: { $sum: "$amount" } } }]),
      PaymentReversal.aggregate([{ $match: periodReversalsFilter }, { $group: { _id: null, count: { $sum: 1 }, reversedAmount: { $sum: "$amount" } } }]),
      Fee.aggregate([{ $match: { schoolId } }, { $group: { _id: null, totalDue: { $sum: "$totalDue" }, recordedPaid: { $sum: "$paidAmount" }, recordedBalance: { $sum: "$balance" } } }]),
      Fee.aggregate([
        { $match: { schoolId } },
        { $lookup: { from: "payments", let: { feeId: "$_id" }, pipeline: [
          { $match: { $expr: { $and: [{ $eq: ["$feeId", "$$feeId"] }, { $eq: ["$schoolId", schoolId] }] } } },
          { $group: { _id: null, gross: { $sum: "$amount" } } },
        ], as: "payments" } },
        { $lookup: { from: "paymentreversals", let: { paymentFeeId: "$_id" }, pipeline: [
          { $lookup: { from: "payments", localField: "paymentId", foreignField: "_id", as: "payment" } },
          { $unwind: "$payment" },
          { $match: { $expr: { $and: [{ $eq: ["$payment.feeId", "$$paymentFeeId"] }, { $eq: ["$schoolId", schoolId] }] } } },
          { $group: { _id: null, reversed: { $sum: "$amount" } } },
        ], as: "reversals" } },
        { $project: { _id: 1, studentId: 1, totalDue: 1, recordedPaid: "$paidAmount", grossPayments: { $ifNull: [{ $arrayElemAt: ["$payments.gross", 0] }, 0] }, reversals: { $ifNull: [{ $arrayElemAt: ["$reversals.reversed", 0] }, 0] } } },
        { $addFields: { netPayments: { $subtract: ["$grossPayments", "$reversals"] } } },
        { $addFields: { variance: { $subtract: ["$recordedPaid", "$netPayments"] } } },
        { $match: { $expr: { $gt: [{ $abs: "$variance" }, 0.01] } } },
        { $limit: 100 },
      ]),
    ]);

    const ledgerGross = ledgerPayments[0]?.grossCollected ?? 0;
    const ledgerReversed = ledgerReversals[0]?.reversedAmount ?? 0;
    const ledgerNet = ledgerGross - ledgerReversed;
    const recordedPaid = feeSummary[0]?.recordedPaid ?? 0;
    const periodGross = periodPayments[0]?.grossCollected ?? 0;
    const periodReversed = periodReversals[0]?.reversedAmount ?? 0;
    const ledgerVariance = Number((recordedPaid - ledgerNet).toFixed(2));

    res.json({
      period: { startDate: startDate ?? null, endDate: endDate ?? null },
      periodCollections: { paymentCount: periodPayments[0]?.count ?? 0, reversalCount: periodReversals[0]?.count ?? 0, grossCollected: periodGross, reversedAmount: periodReversed, netCollected: periodGross - periodReversed },
      ledger: {
        paymentCount: ledgerPayments[0]?.count ?? 0,
        reversalCount: ledgerReversals[0]?.count ?? 0,
        grossCollected: ledgerGross,
        reversedAmount: ledgerReversed,
        netCollected: ledgerNet,
        recordedPaid,
        ledgerVariance,
        reconciled: Math.abs(ledgerVariance) <= 0.01 && mismatches.length === 0,
      },
      feeSummary: { totalDue: feeSummary[0]?.totalDue ?? 0, recordedPaid, recordedBalance: feeSummary[0]?.recordedBalance ?? 0 },
      mismatches,
    });
  } catch (error) {
    next(error);
  }
}
