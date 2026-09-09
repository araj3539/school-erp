import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@school-erp/shared";

const { isModuleEnabled } = vi.hoisted(() => ({ isModuleEnabled: vi.fn() }));
const { findOne } = vi.hoisted(() => ({ findOne: vi.fn() }));
vi.mock("../services/moduleEntitlement.js", () => ({ isModuleEnabled }));
vi.mock("../models/Subscription.js", () => ({ Subscription: { findOne } }));

import { requireModule } from "./moduleEntitlement.js";

function response() {
  const res = { status: vi.fn(), json: vi.fn() } as any;
  res.status.mockReturnValue(res);
  return res;
}

function request(role: UserRole, schoolId?: string, method = "GET") {
  return { method, user: { userId: "u1", email: "admin@example.com", role, schoolId } } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  findOne.mockReturnValue({ select: () => ({ lean: () => Promise.resolve(null) }) });
});

describe("requireModule", () => {
  it("allows a tenant when the server entitlement is enabled", async () => {
    isModuleEnabled.mockResolvedValueOnce(true);
    const next = vi.fn();
    await requireModule("fees")(request(UserRole.PRINCIPAL, "school-1"), response(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("blocks a disabled module before the controller runs", async () => {
    isModuleEnabled.mockResolvedValueOnce(false);
    const next = vi.fn();
    const res = response();
    await requireModule("fees")(request(UserRole.PRINCIPAL, "school-1"), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "MODULE_DISABLED", moduleId: "fees" }));
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks mutations for a subscribed tenant after the grace period", async () => {
    findOne.mockReturnValueOnce({ select: () => ({ lean: () => Promise.resolve({ status: "suspended", currentPeriodEnd: new Date("2030-01-01") }) }) });
    const next = vi.fn();
    const res = response();
    await requireModule("fees")(request(UserRole.PRINCIPAL, "school-1", "POST"), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "SUBSCRIPTION_ACCESS_DENIED", status: "suspended" }));
    expect(next).not.toHaveBeenCalled();
    expect(isModuleEnabled).not.toHaveBeenCalled();
  });

  it("allows reads during a past-due grace period but still blocks mutations", async () => {
    findOne.mockReturnValueOnce({ select: () => ({ lean: () => Promise.resolve({ status: "past_due", currentPeriodEnd: new Date("2030-02-01") }) }) });
    isModuleEnabled.mockResolvedValueOnce(true);
    const next = vi.fn();
    await requireModule("fees")(request(UserRole.PRINCIPAL, "school-1", "GET"), response(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("does not require a tenant entitlement for an unscoped super-admin platform request", async () => {
    const next = vi.fn();
    await requireModule("fees")(request(UserRole.SUPER_ADMIN), response(), next);
    expect(next).toHaveBeenCalledOnce();
    expect(isModuleEnabled).not.toHaveBeenCalled();
  });
});
