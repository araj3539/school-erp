import { UserRole } from "@school-erp/shared";
import { AuditLog, ModuleEntitlement, School, Subscription, User } from "../models/index.js";
import { createAuditLog } from "./auditLog.js";
import { AppError } from "../utils/errors.js";

const SUPPORT_ACTION = "SUPPORT_DIAGNOSTIC_READ";

export async function getSupportDiagnostics(input: {
  supportUserId: string;
  schoolId: string;
  reason: string;
  ip?: string;
  userAgent?: string;
}) {
  const reason = input.reason.trim();
  if (reason.length < 10 || reason.length > 500) throw AppError.badRequest("A support reason between 10 and 500 characters is required");
  if (!input.schoolId) throw AppError.badRequest("Explicit tenant context required");

  const [school, roleCounts, subscription, modules] = await Promise.all([
    School.findById(input.schoolId).select("name email tenantStatus createdAt updatedAt").lean(),
    User.aggregate([
      { $match: { schoolId: schoolIdObject(input.schoolId) } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $project: { _id: 0, role: "$_id", count: 1 } },
      { $sort: { role: 1 } }
    ]),
    Subscription.findOne({ schoolId: input.schoolId }).select("planCode planVersion status currency amountMinor billingInterval startedAt trialEndsAt currentPeriodStart currentPeriodEnd cancelAt cancelledAt provider providerSubscriptionId lastBillingEventAt stateRevision").lean(),
    ModuleEntitlement.find({ schoolId: input.schoolId }).select("moduleId enabled source updatedAt").sort({ moduleId: 1 }).lean(),
  ]);

  if (!school) throw AppError.notFound("Tenant not found");

  const diagnostics = {
    tenant: {
      id: input.schoolId,
      name: school.name,
      email: school.email,
      tenantStatus: school.tenantStatus,
      createdAt: school.createdAt,
      updatedAt: school.updatedAt,
    },
    userCounts: roleCounts,
    subscription: subscription ? {
      planCode: subscription.planCode,
      planVersion: subscription.planVersion,
      status: subscription.status,
      currency: subscription.currency,
      amountMinor: subscription.amountMinor,
      billingInterval: subscription.billingInterval,
      startedAt: subscription.startedAt,
      trialEndsAt: subscription.trialEndsAt,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAt: subscription.cancelAt,
      cancelledAt: subscription.cancelledAt,
      provider: subscription.provider,
      providerSubscriptionId: subscription.providerSubscriptionId,
      lastBillingEventAt: subscription.lastBillingEventAt,
      stateRevision: subscription.stateRevision,
    } : null,
    modules,
  };

  await createAuditLog({
    userId: input.supportUserId,
    schoolId: input.schoolId,
    action: SUPPORT_ACTION,
    entity: "School",
    entityId: input.schoolId,
    after: { outcome: "success", reason, supportRole: UserRole.SUPPORT_ADMIN },
    ip: input.ip,
    userAgent: input.userAgent,
  });

  return diagnostics;
}

export async function recordSupportAccessOutcome(input: {
  supportUserId: string;
  schoolId: string;
  reason: string;
  outcome: "denied" | "error";
  errorCode?: string;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  await createAuditLog({
    userId: input.supportUserId,
    schoolId: input.schoolId,
    action: SUPPORT_ACTION,
    entity: "School",
    entityId: input.schoolId,
    after: { outcome: input.outcome, reason: input.reason.trim().slice(0, 500), errorCode: input.errorCode },
    ip: input.ip,
    userAgent: input.userAgent,
  });
}

function schoolIdObject(value: string) {
  const mongoose = requireMongoose();
  if (!mongoose.isValidObjectId(value)) throw AppError.badRequest("Invalid tenant id");
  return new mongoose.Types.ObjectId(value);
}

function requireMongoose() {
  return require("mongoose") as typeof import("mongoose");
}

export async function getSupportAuditHistory(schoolId: string, page = 1, limit = 20) {
  if (!schoolId || !requireMongoose().isValidObjectId(schoolId)) throw AppError.badRequest("Invalid tenant id");
  const safePage = Math.max(1, Math.min(page, 100000));
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const query = { schoolId, action: { $regex: /^SUPPORT_/ } };
  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    AuditLog.countDocuments(query),
  ]);
  return { logs, total, page: safePage, limit: safeLimit, pages: Math.ceil(total / safeLimit) };
}
