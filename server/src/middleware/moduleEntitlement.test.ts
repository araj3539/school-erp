import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@school-erp/shared";

const { isModuleEnabled } = vi.hoisted(() => ({ isModuleEnabled: vi.fn() }));
vi.mock("../services/moduleEntitlement.js", () => ({ isModuleEnabled }));

import { requireModule } from "./moduleEntitlement.js";

function response() {
  const res = { status: vi.fn(), json: vi.fn() } as any;
  res.status.mockReturnValue(res);
  return res;
}

function request(role: UserRole, schoolId?: string) {
  return { user: { userId: "u1", email: "admin@example.com", role, schoolId } } as any;
}

describe("requireModule", () => {
  beforeEach(() => vi.clearAllMocks());

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

  it("does not require a tenant entitlement for an unscoped super-admin platform request", async () => {
    const next = vi.fn();
    await requireModule("fees")(request(UserRole.SUPER_ADMIN), response(), next);
    expect(next).toHaveBeenCalledOnce();
    expect(isModuleEnabled).not.toHaveBeenCalled();
  });
});
