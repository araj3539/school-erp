import { AuditLog, School, Subscription, TenantUsage } from "../models/index.js";

const HIGH_RISK_ACTION_PATTERN = /^(TENANT_LIFECYCLE_CHANGE|MODULE_ENTITLEMENT_UPDATE|SUBSCRIPTION_|SAAS_INVOICE_|TENANT_USAGE_LIMIT_CHANGE|SUPPORT_)/;

export async function getPlatformOperationsOverview() {
  const [tenantStatus, subscriptionStatus, usage, recentAudit] = await Promise.all([
    School.aggregate([
      { $group: { _id: "$tenantStatus", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } },
      { $sort: { status: 1 } },
    ]),
    Subscription.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } },
      { $sort: { status: 1 } },
    ]),
    TenantUsage.aggregate([
      {
        $group: {
          _id: null,
          students: { $sum: "$counters.students" },
          school_users: { $sum: "$counters.school_users" },
          storage_bytes: { $sum: "$counters.storage_bytes" },
        },
      },
      { $project: { _id: 0, students: 1, school_users: 1, storage_bytes: 1 } },
    ]),
    AuditLog.find({ action: { $regex: HIGH_RISK_ACTION_PATTERN } })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("schoolId userId actorType action entity entityId before after ip userAgent createdAt")
      .lean(),
  ]);

  return {
    tenants: { byStatus: tenantStatus },
    subscriptions: { byStatus: subscriptionStatus },
    usage: usage[0] ?? { students: 0, school_users: 0, storage_bytes: 0 },
    recentHighRiskAudit: recentAudit,
  };
}

export async function listPlatformAuditLogs(filters: {
  schoolId?: string;
  userId?: string;
  action?: string;
  entity?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const query: Record<string, unknown> = {};
  if (filters.schoolId) query.schoolId = filters.schoolId;
  if (filters.userId) query.userId = filters.userId;
  if (filters.action) query.action = filters.action;
  if (filters.entity) query.entity = filters.entity;
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) (query.createdAt as Record<string, Date>).$gte = filters.startDate;
    if (filters.endDate) (query.createdAt as Record<string, Date>).$lte = filters.endDate;
  }

  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("schoolId userId actorType action entity entityId before after ip userAgent createdAt")
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  return { logs, total, page, limit, pages: Math.ceil(total / limit) };
}
