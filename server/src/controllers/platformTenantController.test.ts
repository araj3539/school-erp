import { beforeEach, describe, expect, it, vi } from "vitest";

const { startSession, findById, save, createAuditLog } = vi.hoisted(() => ({
  startSession: vi.fn(),
  findById: vi.fn(),
  save: vi.fn(),
  createAuditLog: vi.fn(),
}));

vi.mock("mongoose", () => ({ default: { startSession } }));
vi.mock("../models/index.js", () => ({ School: { findById } }));
vi.mock("../services/auditLog.js", () => ({ createAuditLog }));
vi.mock("../services/tenantLifecycle.js", () => ({
  assertTenantTransition: vi.fn((from: string, to: string) => {
    if (from === "archived" && to !== "archived") throw new Error("cannot transition archived tenant");
  }),
  nextTenantTimestamps: vi.fn(() => ({ suspendedAt: new Date("2026-09-09T00:00:00.000Z") })),
}));

import { updatePlatformTenantLifecycle } from "./platformTenantController.js";

function response() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
}

function request() {
  return {
    validatedParams: { id: "66c000000000000000000001" },
    body: { status: "suspended", reason: "billing hold" },
    user: { userId: "platform-admin" },
    ip: "127.0.0.1",
    get: vi.fn(() => "test-agent"),
  } as any;
}

function setupTransaction() {
  const session = {
    withTransaction: vi.fn(async (callback: () => Promise<void>) => callback()),
    endSession: vi.fn().mockResolvedValue(undefined),
  };
  startSession.mockResolvedValue(session);
  const school = {
    _id: { toString: () => "66c000000000000000000001" },
    tenantStatus: "active",
    suspendedAt: undefined,
    archivedAt: undefined,
    save,
    toObject: vi.fn(() => ({ tenantStatus: "suspended" })),
  };
  const query = { session: vi.fn().mockResolvedValue(school) };
  findById.mockReturnValue(query);
  save.mockResolvedValue(school);
  createAuditLog.mockResolvedValue(undefined);
  return { session, school, query };
}

describe("platform tenant lifecycle controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates the tenant and writes its audit record in the same session", async () => {
    const { session, school, query } = setupTransaction();
    const res = response();

    await updatePlatformTenantLifecycle(request(), res, vi.fn());

    expect(query.session).toHaveBeenCalledWith(session);
    expect(save).toHaveBeenCalledWith({ session });
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ session, schoolId: "66c000000000000000000001", action: "TENANT_LIFECYCLE_CHANGE" }));
    expect(session.withTransaction).toHaveBeenCalledOnce();
    expect(session.endSession).toHaveBeenCalledOnce();
    expect(school.tenantStatus).toBe("suspended");
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ idempotentReplay: false }));
  });

  it("does not acknowledge the lifecycle change when the audit write fails", async () => {
    const { session } = setupTransaction();
    createAuditLog.mockRejectedValue(new Error("audit unavailable"));
    const next = vi.fn();

    await updatePlatformTenantLifecycle(request(), response(), next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(session.endSession).toHaveBeenCalledOnce();
  });
});
