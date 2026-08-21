import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { UserRole } from "@school-erp/shared";

const JWT_SECRET = "01234567890123456789012345678901";
vi.mock("../config/index.js", () => ({ env: { JWT_SECRET } }));
import { authenticate, optionalAuth } from "./auth.js";

function createRequest(token?: string, selectedSchoolId?: string) {
  return { cookies: token ? { access_token: token } : {}, get: vi.fn((name: string) => name === "X-School-Id" ? selectedSchoolId : undefined) } as any;
}
function createResponse() { return { status: vi.fn().mockReturnThis(), json: vi.fn() } as any; }
function sign(payload: { userId: string; email: string; role: UserRole; schoolId?: string }) { return jwt.sign(payload, JWT_SECRET); }

describe("authentication tenant context", () => {
  const next = vi.fn();
  beforeEach(() => next.mockReset());

  it("accepts a school user with a schoolId", () => {
    const req = createRequest(sign({ userId: "user-1", email: "admin@school.com", role: UserRole.ADMIN, schoolId: "school-1" }));
    const res = createResponse(); authenticate(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toMatchObject({ role: UserRole.ADMIN, schoolId: "school-1" });
  });

  it("rejects a school user without a schoolId", () => {
    const req = createRequest(sign({ userId: "user-1", email: "admin@school.com", role: UserRole.ADMIN }));
    const res = createResponse(); authenticate(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("accepts a super admin without a schoolId", () => {
    const req = createRequest(sign({ userId: "super-1", email: "super@platform.com", role: UserRole.SUPER_ADMIN }));
    const res = createResponse(); authenticate(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user.schoolId).toBeUndefined();
  });

  it("adds request-scoped school context for a super admin without changing the token identity", () => {
    const req = createRequest(sign({ userId: "super-1", email: "super@platform.com", role: UserRole.SUPER_ADMIN }), "66c000000000000000000001");
    const res = createResponse(); authenticate(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toMatchObject({ role: UserRole.SUPER_ADMIN, schoolId: "66c000000000000000000001" });
  });

  it("rejects an invalid selected school id", () => {
    const req = createRequest(sign({ userId: "super-1", email: "super@platform.com", role: UserRole.SUPER_ADMIN }), "invalid");
    const res = createResponse(); authenticate(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects a super admin token containing a schoolId", () => {
    const req = createRequest(sign({ userId: "super-1", email: "super@platform.com", role: UserRole.SUPER_ADMIN, schoolId: "school-1" }));
    const res = createResponse(); authenticate(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("does not attach an invalid tenant context in optional authentication", () => {
    const req = createRequest(sign({ userId: "user-1", email: "admin@school.com", role: UserRole.ADMIN }));
    optionalAuth(req, createResponse(), next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toBeUndefined();
  });
});
