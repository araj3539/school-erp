import { beforeEach, describe, expect, it, vi } from "vitest";

const { auditCreate, auditFind, auditCount, userFindById } = vi.hoisted(() => ({
  auditCreate: vi.fn(),
  auditFind: vi.fn(),
  auditCount: vi.fn(),
  userFindById: vi.fn(),
}));

vi.mock("../models/index.js", () => ({
  AuditLog: { create: auditCreate, find: auditFind, countDocuments: auditCount },
  User: { findById: userFindById },
}));

import { createAuditLog, getAuditLogs } from "./auditLog.js";

describe("audit log tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auditCreate.mockResolvedValue(undefined);
    auditCount.mockResolvedValue(0);
    auditFind.mockReturnValue({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            lean: () => ({ exec: async () => [] }),
          }),
        }),
      }),
    });
  });

  it("stores the authenticated user's school when the caller omits schoolId", async () => {
    userFindById.mockReturnValue({
      select: () => ({ lean: async () => ({ schoolId: "school-a", role: "principal" }) }),
    });

    await createAuditLog({ userId: "user-a", action: "READ", entity: "Student", entityId: "student-a" });

    expect(auditCreate).toHaveBeenCalledWith(expect.objectContaining({ schoolId: "school-a" }));
  });

  it("does not infer another tenant when the user is a platform account", async () => {
    userFindById.mockReturnValue({
      select: () => ({ lean: async () => ({ role: "super_admin" }) }),
    });

    await createAuditLog({ userId: "platform-admin", action: "READ", entity: "School", entityId: "school-a" });

    expect(auditCreate).toHaveBeenCalledWith(expect.not.objectContaining({ schoolId: expect.anything() }));
  });

  it("always scopes audit-log queries by the requested tenant", async () => {
    await getAuditLogs({ schoolId: "school-a", entity: "Student", page: 1, limit: 20 });

    expect(auditFind).toHaveBeenCalledWith({ schoolId: "school-a", entity: "Student" });
    expect(auditCount).toHaveBeenCalledWith({ schoolId: "school-a", entity: "Student" });
  });
});
