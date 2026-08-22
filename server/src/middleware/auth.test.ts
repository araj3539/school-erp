import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { UserRole } from "@school-erp/shared";

const JWT_SECRET = "01234567890123456789012345678901";
const schoolExists = vi.fn();
vi.mock("../config/index.js", () => ({ env: { JWT_SECRET } }));
vi.mock("../models/index.js", () => ({ School: { exists: schoolExists } }));
import { authenticate, optionalAuth } from "./auth.js";

function createRequest(token?: string, selectedSchoolId?: string) {
  return { cookies: token ? { access_token: token } : {}, get: vi.fn((name: string) => name === "X-School-Id" ? selectedSchoolId : undefined) } as any;
}
function createResponse() { return { status: vi.fn().mockReturnThis(), json: vi.fn() } as any; }
function sign(payload: { userId: string; email: string; role: UserRole; schoolId?: string }) { return jwt.sign(payload, JWT_SECRET); }

describe("authentication tenant context", () => {
  const next = vi.fn();
  beforeEach(() => {
    next.mockReset();
    schoolExists.mockReset();
    schoolExists.mockResolvedValue(true);
  });

  it("accepts a school user with a schoolId", async () => {
    const req = createRequest(sign({ userId: "user-1", email: "principal@school.com", role: UserRole.PRINCIPAL, schoolId: "school-1" }));
    const res = createResponse(); await authenticate(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toMatchObject({ role: UserRole.PRINCIPAL, schoolId: "school-1" });
  });

  it("rejects a school user without a schoolId", async () => {
    const req = createRequest(sign({ userId: "user-1", email: "principal@school.com", role: UserRole.PRINCIPAL }));
    const res = createResponse(); await authenticate(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("accepts a super admin without a schoolId", async () => {
    const req = createRequest(sign({ userId: "super-1", email: "super@platform.com", role: UserRole.SUPER_ADMIN }));
    const res = createResponse(); await authenticate(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user.schoolId).toBeUndefined();
  });

  it("adds request-scoped school context for an existing school without changing token identity", async () => {
    const selectedSchoolId = "66c000000000000000000001";
    const req = createRequest(sign({ userId: "super-1", email: "super@platform.com", role: UserRole.SUPER_ADMIN }), selectedSchoolId);
    const res = createResponse(); await authenticate(req, res, next);
    expect(schoolExists).toHaveBeenCalledWith({ _id: selectedSchoolId });
    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toMatchObject({ role: UserRole.SUPER_ADMIN, schoolId: selectedSchoolId });
  });

  it("rejects a syntactically valid but unknown selected school", async () => {
    schoolExists.mockResolvedValue(false);
    const req = createRequest(sign({ userId: "super-1", email: "super@platform.com", role: UserRole.SUPER_ADMIN }), "66c000000000000000000001");
    const res = createResponse(); await authenticate(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects an invalid selected school id", async () => {
    const req = createRequest(sign({ userId: "super-1", email: "super@platform.com", role: UserRole.SUPER_ADMIN }), "invalid");
    const res = createResponse(); await authenticate(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(schoolExists).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects a super admin token containing a schoolId", async () => {
    const req = createRequest(sign({ userId: "super-1", email: "super@platform.com", role: UserRole.SUPER_ADMIN, schoolId: "school-1" }));
    const res = createResponse(); await authenticate(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("does not attach an invalid tenant context in optional authentication", async () => {
    const req = createRequest(sign({ userId: "user-1", email: "principal@school.com", role: UserRole.PRINCIPAL }));
    await optionalAuth(req, createResponse(), next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toBeUndefined();
  });

  it("silently ignores an unknown selected school in optional authentication", async () => {
    schoolExists.mockResolvedValue(false);
    const req = createRequest(sign({ userId: "super-1", email: "super@platform.com", role: UserRole.SUPER_ADMIN }), "66c000000000000000000001");
    await optionalAuth(req, createResponse(), next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toBeUndefined();
  });
});
