import { Types } from "mongoose";
import { FeeItem, Payment } from "../models/index.js";

const DAY_MS = 86_400_000;

function objectId(value?: string) {
  return value ? new Types.ObjectId(value) : undefined;
}

function dateEnd(value?: string) {
  return value ? new Date(`${value}T23:59:59.999Z`) : undefined;
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
  const match: Record<string, unknown> = {
    schoolId: new Types.ObjectId(params.schoolId),
    balance: { $gt: 0 },
    dueDate: { $lt: asOf },
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
    summary: result?.summary ?? [],
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
  if (params.startDate || params.endDate) match.dueDate = { ...(params.startDate ? { $gte: new Date(`${params.startDate}T00:00:00.000Z`) } : {}), ...(params.endDate ? { $lte: dateEnd(params.endDate) } : {}) };
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
  const byHead = await FeeItem.aggregate(pipeline);
  const totals = byHead.reduce((acc, row) => ({
    items: acc.items + row.items, amount: acc.amount + row.amount, discount: acc.discount + row.discount,
    fine: acc.fine + row.fine, totalDue: acc.totalDue + row.totalDue, paid: acc.paid + row.paid, balance: acc.balance + row.balance,
  }), { items: 0, amount: 0, discount: 0, fine: 0, totalDue: 0, paid: 0, balance: 0 });
  return { byHead, totals };
}

export async function getPaymentReconciliationExceptions(params: { schoolId: string; page: number; limit: number; startDate?: string; endDate?: string }) {
  const match: Record<string, unknown> = { schoolId: new Types.ObjectId(params.schoolId) };
  if (params.startDate || params.endDate) match.date = { ...(params.startDate ? { $gte: new Date(`${params.startDate}T00:00:00.000Z`) } : {}), ...(params.endDate ? { $lte: dateEnd(params.endDate) } : {}) };
  const pipeline: any[] = [
    { $match: match },
    { $lookup: { from: "paymentallocations", localField: "_id", foreignField: "paymentId", as: "allocations" } },
    { $set: { allocatedAmount: { $reduce: { input: "$allocations", initialValue: 0, in: { $add: ["$$value", { $cond: [{ $eq: ["$$this.type", "allocation"] }, "$$this.amount", { $multiply: ["$$this.amount", -1] }] }] } } } } },
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
