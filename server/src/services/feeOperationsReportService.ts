import { Types } from "mongoose";
import { FeeItem, Payment } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { startOfUtcDay } from "./feeStatus.js";

const DAY_MS = 86_400_000;

const money = (value: number) => Math.round(value * 100) / 100;

function objectId(value?: string) {
  if (!value) return undefined;
  if (!Types.ObjectId.isValid(value)) throw AppError.badRequest("Invalid ObjectId filter value");
  return new Types.ObjectId(value);
}

function dateStart(value?: string) {
  if (!value) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw AppError.badRequest("Date filters must be YYYY-MM-DD");
  return new Date(`${value}T00:00:00.000Z`);
}

function dateEnd(value?: string) {
  const start = dateStart(value);
  return start ? new Date(start.getTime() + DAY_MS - 1) : undefined;
}

export async function getFeeDefaulters(params: {
  schoolId: string;
  page: number;
  limit: number;
  classId?: string;
  sectionId?: string;
  feeHeadId?: string;
  academicYear?: string;
  agingBucket?: string;
  asOf?: string;
}) {
  const asOf = dateEnd(params.asOf) ?? new Date();
  // Overdue means the entire due day has passed (see feeStatus.ts): fees due
  // today are still payable and must not be listed as defaulters.
  const overdueCutoff = startOfUtcDay(asOf);
  const match: Record<string, unknown> = {
    schoolId: new Types.ObjectId(params.schoolId),
    balance: { $gt: 0 },
    dueDate: { $lt: overdueCutoff },
  };
  if (params.feeHeadId) match.feeHeadId = objectId(params.feeHeadId);
  if (params.academicYear) match.academicYear = objectId(params.academicYear);

  const pipeline: any[] = [
    { $match: match },
    { $set: { daysOverdue: { $floor: { $divide: [{ $subtract: [asOf, "$dueDate"] }, DAY_MS] } } } },
    { $set: { agingBucket: { $switch: { branches: [
      { case: { $lte: ["$daysOverdue", 30] }, then: "1-30" },
      { case: { $lte: ["$daysOverdue", 60] }, then: "31-60" },
      { case: { $lte: ["$daysOverdue", 90] }, then: "61-90" },
    ], default: "91+" } } } },
    ...(params.agingBucket ? [{ $match: { agingBucket: params.agingBucket } }] : []),
    { $lookup: { from: "students", localField: "studentId", foreignField: "_id", as: "student" } },
    { $unwind: "$student" },
    ...(params.classId ? [{ $match: { "student.classId": objectId(params.classId) } }] : []),
    ...(params.sectionId ? [{ $match: { "student.sectionId": objectId(params.sectionId) } }] : []),
    { $lookup: { from: "classes", localField: "student.classId", foreignField: "_id", as: "class" } },
    { $lookup: { from: "sections", localField: "student.sectionId", foreignField: "_id", as: "section" } },
    { $lookup: { from: "feeheads", localField: "feeHeadId", foreignField: "_id", as: "feeHead" } },
    { $unwind: { path: "$class", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$section", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$feeHead", preserveNullAndEmptyArrays: true } },
    { $sort: { daysOverdue: -1, dueDate: 1, _id: 1 } },
    { $facet: {
      data: [
        { $skip: (params.page - 1) * params.limit },
        { $limit: params.limit },
        { $project: {
          _id: 1, studentId: 1, feeId: 1, feeHeadId: 1, academicYear: 1,
          label: 1, amount: 1, discount: 1, fine: 1, totalDue: 1, paidAmount: 1,
          balance: 1, dueDate: 1, daysOverdue: 1, agingBucket: 1,
          student: { _id: "$student._id", admissionNo: "$student.admissionNo", firstName: "$student.firstName", lastName: "$student.lastName" },
          class: { _id: "$class._id", name: "$class.name", displayName: "$class.displayName" },
          section: { _id: "$section._id", name: "$section.name" },
          feeHead: { _id: "$feeHead._id", name: "$feeHead.name", code: "$feeHead.code", category: "$feeHead.category" },
        } },
      ],
      total: [{ $count: "count" }],
      summary: [{ $group: { _id: "$agingBucket", count: { $sum: 1 }, balance: { $sum: "$balance" } } }],
    } },
  ];
  const [result] = await FeeItem.aggregate(pipeline);
  return {
    data: result?.data ?? [],
    pagination: { page: params.page, limit: params.limit, total: result?.total?.[0]?.count ?? 0, totalPages: Math.ceil((result?.total?.[0]?.count ?? 0) / params.limit) },
    // $round cannot wrap an accumulator inside $group; round the grouped sums here.
    summary: (result?.summary ?? []).map((row: any) => ({ ...row, balance: money(Number(row.balance ?? 0)) })),
    asOf,
  };
}

export async function getFeeLedgerSummary(params: {
  schoolId: string;
  classId?: string;
  sectionId?: string;
  feeHeadId?: string;
  academicYear?: string;
  startDate?: string;
  endDate?: string;
}) {
  const match: Record<string, unknown> = { schoolId: new Types.ObjectId(params.schoolId) };
  if (params.feeHeadId) match.feeHeadId = objectId(params.feeHeadId);
  if (params.academicYear) match.academicYear = objectId(params.academicYear);
  if (params.startDate || params.endDate) match.dueDate = { ...(params.startDate ? { $gte: dateStart(params.startDate) } : {}), ...(params.endDate ? { $lte: dateEnd(params.endDate) } : {}) };
  const pipeline: any[] = [
    { $match: match },
    { $lookup: { from: "students", localField: "studentId", foreignField: "_id", as: "student" } },
    { $unwind: "$student" },
    ...(params.classId ? [{ $match: { "student.classId": objectId(params.classId) } }] : []),
    ...(params.sectionId ? [{ $match: { "student.sectionId": objectId(params.sectionId) } }] : []),
    { $lookup: { from: "feeheads", localField: "feeHeadId", foreignField: "_id", as: "feeHead" } },
    { $unwind: { path: "$feeHead", preserveNullAndEmptyArrays: true } },
    { $group: { _id: "$feeHeadId", feeHead: { $first: "$feeHead" }, items: { $sum: 1 }, amount: { $sum: "$amount" }, discount: { $sum: "$discount" }, fine: { $sum: "$fine" }, totalDue: { $sum: "$totalDue" }, paid: { $sum: "$paidAmount" }, balance: { $sum: "$balance" } } },
    { $sort: { "feeHead.code": 1, _id: 1 } },
  ];
  const rawByHead = await FeeItem.aggregate(pipeline);
  // $round cannot wrap an accumulator inside $group; round the grouped sums here.
  const byHead = rawByHead.map((row: any) => ({
    ...row,
    amount: money(Number(row.amount ?? 0)), discount: money(Number(row.discount ?? 0)), fine: money(Number(row.fine ?? 0)),
    totalDue: money(Number(row.totalDue ?? 0)), paid: money(Number(row.paid ?? 0)), balance: money(Number(row.balance ?? 0)),
  }));
  const totals = byHead.reduce((acc, row) => ({
    items: acc.items + row.items, amount: money(acc.amount + row.amount), discount: money(acc.discount + row.discount),
    fine: money(acc.fine + row.fine), totalDue: money(acc.totalDue + row.totalDue), paid: money(acc.paid + row.paid), balance: money(acc.balance + row.balance),
  }), { items: 0, amount: 0, discount: 0, fine: 0, totalDue: 0, paid: 0, balance: 0 });
  return { byHead, totals };
}

export async function getPaymentReconciliationExceptions(params: { schoolId: string; page: number; limit: number; startDate?: string; endDate?: string }) {
  const match: Record<string, unknown> = { schoolId: new Types.ObjectId(params.schoolId) };
  if (params.startDate || params.endDate) match.date = { ...(params.startDate ? { $gte: dateStart(params.startDate) } : {}), ...(params.endDate ? { $lte: dateEnd(params.endDate) } : {}) };
  const pipeline: any[] = [
    { $match: match },
    { $lookup: { from: "paymentallocations", localField: "_id", foreignField: "paymentId", as: "allocations" } },
    { $set: { allocatedAmount: { $round: [{ $reduce: { input: "$allocations", initialValue: 0, in: { $add: ["$$value", { $cond: [{ $eq: ["$$this.type", "allocation"] }, "$$this.amount", { $multiply: ["$$this.amount", -1] }] }] } } }, 2] } } },
    { $set: { difference: { $round: [{ $subtract: ["$amount", "$allocatedAmount"] }, 2] } } },
    { $match: { difference: { $ne: 0 } } },
    { $sort: { date: -1, _id: 1 } },
    { $facet: {
      data: [{ $skip: (params.page - 1) * params.limit }, { $limit: params.limit }, { $project: { _id: 1, studentId: 1, feeId: 1, amount: 1, mode: 1, transactionId: 1, receiptNo: 1, date: 1, allocatedAmount: 1, difference: 1 } }],
      total: [{ $count: "count" }],
    } },
  ];
  const [result] = await Payment.aggregate(pipeline);
  const total = result?.total?.[0]?.count ?? 0;
  return { data: result?.data ?? [], pagination: { page: params.page, limit: params.limit, total, totalPages: Math.ceil(total / params.limit) } };
}
