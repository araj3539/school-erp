import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { UserRole } from "@school-erp/shared";

const { JWT_SECRET, schoolExists } = vi.hoisted(() => ({
  JWT_SECRET: Buffer.alloc(32, 7),
  schoolExists: vi.fn(),
}));

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
