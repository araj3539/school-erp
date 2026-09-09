import { beforeEach, describe, expect, it, vi } from "vitest";

const { aggregateSchool, aggregateSubscription, aggregateUsage, auditFind, auditCount } = vi.hoisted(() => ({
  aggregateSchool: vi.fn(),
  aggregateSubscription: vi.fn(),
  aggregateUsage: vi.fn(),
  auditFind: vi.fn(),
  auditCount: vi.fn(),
}));

vi.mock("../models/index.js", () => ({
  School: { aggregate: aggregateSchool },
  Subscription: { aggregate: aggregateSubscription },
  TenantUsage: { aggregate: aggregateUsage },
  AuditLog: { find: auditFind, countDocuments: auditCount },
}));

import { getPlatformOperationsOverview, listPlatformAuditLogs } from "./platformOperations.js";

function auditQuery(result: unknown[]) {
  const query = {
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(result),
  };
  auditFind.mockReturnValue(query);
  return query;
}

describe("platform operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("aggregates tenant, subscription, usage and recent high-risk audit visibility", async () => {
    aggregateSchool.mockResolvedValue([{ status: "active", count: 2 }]);
    aggregateSubscription.mockResolvedValue([{ status: "trialing", count: 1 }]);
    aggregateUsage.mockResolvedValue([{ students: 10, school_users: 5, storage_bytes: 1024 }]);
    const audit = [{ action: "TENANT_LIFECYCLE_CHANGE" }];
    const query = auditQuery(audit);

    const result = await getPlatformOperationsOverview();

    expect(result.tenants.byStatus).toEqual([{ status: "active", count: 2 }]);
    expect(result.subscriptions.byStatus).toEqual([{ status: "trialing", count: 1 }]);
    expect(result.usage).toEqual({ students: 10, school_users: 5, storage_bytes: 1024 });
    expect(result.recentHighRiskAudit).toEqual(audit);
    expect(query.limit).toHaveBeenCalledWith(20);
    const auditFilter = auditFind.mock.calls[0][0];
    expect(auditFilter.action.$regex).toBeInstanceOf(RegExp);
  });

  it("returns empty aggregate usage when no tenant usage records exist", async () => {
    aggregateSchool.mockResolvedValue([]);
    aggregateSubscription.mockResolvedValue([]);
    aggregateUsage.mockResolvedValue([]);
    auditQuery([]);

    const result = await getPlatformOperationsOverview();

    expect(result.usage).toEqual({ students: 0, school_users: 0, storage_bytes: 0 });
  });

  it("filters platform audit history by explicit tenant and preserves pagination", async () => {
    const logs = [{ action: "TENANT_USAGE_LIMIT_CHANGE" }];
    const query = auditQuery(logs);
    auditCount.mockResolvedValue(7);

    const result = await listPlatformAuditLogs({
      schoolId: "66c000000000000000000001",
      action: "TENANT_USAGE_LIMIT_CHANGE",
      page: 2,
      limit: 5,
    });

    expect(auditFind).toHaveBeenCalledWith({
      schoolId: "66c000000000000000000001",
      action: "TENANT_USAGE_LIMIT_CHANGE",
    });
    expect(query.skip).toHaveBeenCalledWith(5);
    expect(query.limit).toHaveBeenCalledWith(5);
    expect(result).toEqual({ logs, total: 7, page: 2, limit: 5, pages: 2 });
  });
});
