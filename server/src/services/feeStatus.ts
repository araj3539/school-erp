import { FeeStatus } from "@school-erp/shared";

/**
 * Effective fee status.
 *
 * Stored fee records are immutable financial facts, so the "overdue" state is
 * derived at read time instead of being mutated by a job: a fee whose structure
 * has a due date, whose due day has fully passed, and which still has an
 * outstanding balance on a pending/partial record is effectively OVERDUE.
 * This mirrors the existing read-time overdue patterns used for library loans
 * and SaaS invoices.
 */

export function startOfUtcDay(value: Date = new Date()): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

/**
 * A fee is overdue once its entire due day has passed: fees are payable through
 * the end of their due date and become overdue the following (UTC) calendar day.
 * Structure due dates are calendar dates normalized to UTC midnight, so a fee
 * is never shown as overdue on or before its due date.
 */
export function isFeeOverdue(status: string, dueDate: Date | string | null | undefined, balance: number, now: Date = new Date()): boolean {
  if (balance <= 0) return false;
  if (status !== FeeStatus.PENDING && status !== FeeStatus.PARTIAL) return false;
  if (!dueDate) return false;
  const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
  if (Number.isNaN(due.getTime())) return false;
  return due.getTime() < startOfUtcDay(now).getTime();
}

export function computeEffectiveFeeStatus(status: string, dueDate: Date | string | null | undefined, balance: number, now: Date = new Date()): FeeStatus {
  if (isFeeOverdue(status, dueDate, balance, now)) return FeeStatus.OVERDUE;
  return status as FeeStatus;
}

/**
 * Aggregation stages that attach `effectiveStatus` to fee documents by joining
 * the structure due date. Append after a tenant-scoped $match stage, then group
 * or filter on `effectiveStatus`.
 */
export function effectiveFeeStatusStages(now: Date = new Date()): any[] {
  const overdueCutoff = startOfUtcDay(now);
  return [
    { $lookup: { from: "feestructures", localField: "feeStructureId", foreignField: "_id", as: "__feeStructure" } },
    { $unwind: { path: "$__feeStructure", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        effectiveStatus: {
          $cond: [
            {
              $and: [
                { $in: ["$status", [FeeStatus.PENDING, FeeStatus.PARTIAL]] },
                { $gt: ["$balance", 0] },
                { $ne: [{ $ifNull: ["$__feeStructure.dueDate", null] }, null] },
                { $lt: ["$__feeStructure.dueDate", overdueCutoff] },
              ],
            },
            FeeStatus.OVERDUE,
            "$status",
          ],
        },
      },
    },
  ];
}
