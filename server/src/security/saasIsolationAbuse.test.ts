import { describe, expect, it, vi } from "vitest";
import { UserRole } from "@school-erp/shared";
import { requirePlatformRole } from "../middleware/auth.js";
import { requirePermission } from "../middleware/rbac.js";
import { Payment } from "../models/Payment.js";
import { PaymentReversal } from "../models/PaymentReversal.js";
import { PaymentWebhookEvent } from "../models/PaymentWebhookEvent.js";
import { getRemainingReversibleAmount } from "../controllers/paymentController.js";
import { getNextSubscriptionStatus } from "../services/billing.js";
import { evaluateSubscriptionLifecycle } from "../services/subscriptionLifecycle.js";
import { getTenantId, withTenant } from "../utils/tenant.js";

function response() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
}

function schoolRequest(schoolId = "507f1f77bcf86cd799439011", selectedSchoolId?: string) {
  return {
    user: { userId: "principal-1", email: "principal@example.com", role: UserRole.PRINCIPAL, schoolId },
    get: (name: string) => name === "X-School-Id" ? selectedSchoolId : undefined,
  } as any;
}

describe("SaaS isolation and abuse regression matrix", () => {
  it("cannot switch a school principal into another tenant", () => {
    const req = schoolRequest(undefined, "507f1f77bcf86cd799439012");
    expect(getTenantId(req)).toBe("507f1f77bcf86cd799439011");
    expect(withTenant(req, { schoolId: "507f1f77bcf86cd799439012", name: "attacker input" })).toEqual({
      schoolId: "507f1f77bcf86cd799439011",
      name: "attacker input",
    });
  });

  it("does not allow a platform super-admin to become school authority", () => {
    const next = vi.fn();
    const res = response();
    requirePlatformRole({
      user: { userId: "platform-1", email: "platform@example.com", role: UserRole.SUPER_ADMIN, schoolId: "507f1f77bcf86cd799439011" },
    } as any, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("denies privilege escalation from teacher to payment collection", () => {
    const next = vi.fn();
    const res = response();
    requirePermission("payments:write")({
      user: { userId: "teacher-1", email: "teacher@example.com", role: UserRole.TEACHER, schoolId: "507f1f77bcf86cd799439011" },
    } as any, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("denies broad student reads to student principals of their own account", () => {
    const next = vi.fn();
    const res = response();
    requirePermission("students:read")({
      user: { userId: "student-1", email: "student@example.com", role: UserRole.STUDENT, schoolId: "507f1f77bcf86cd799439011" },
    } as any, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("prevents payment over-refund and negative financial values", () => {
    expect(getRemainingReversibleAmount(1000, 250, 750)).toBe(0);
    expect(() => getRemainingReversibleAmount(1000, 250, 751)).toThrow(/exceeds remaining/);
    expect(() => getRemainingReversibleAmount(1000, 1000, 1)).toThrow(/exceeds remaining/);
    expect(Payment.schema.path("amount").options.min).toBe(0.01);
    expect(PaymentReversal.schema.path("amount").options.min).toBe(0.01);
  });

  it("uses tenant-scoped database uniqueness as the concurrency guard for payment idempotency", () => {
    const indexes = Payment.schema.indexes();
    expect(indexes).toEqual(expect.arrayContaining([
      [expect.objectContaining({ schoolId: 1, idempotencyKey: 1 }), expect.objectContaining({ unique: true, sparse: true })],
      [expect.objectContaining({ schoolId: 1, transactionId: 1 }), expect.objectContaining({ unique: true, sparse: true })],
    ]));
  });

  it("rejects webhook replay at the provider-event boundary and keeps a processing lease index", () => {
    const indexes = PaymentWebhookEvent.schema.indexes();
    expect(indexes).toEqual(expect.arrayContaining([
      [expect.objectContaining({ provider: 1, eventId: 1 }), expect.objectContaining({ unique: true })],
      [expect.objectContaining({ provider: 1, status: 1, processingAt: 1 }), expect.any(Object)],
    ]));
  });

  it("rejects invalid billing transitions rather than accepting client-driven state jumps", () => {
    expect(() => getNextSubscriptionStatus("expired", "recover")).toThrow(/Invalid subscription transition/);
    expect(() => getNextSubscriptionStatus("cancelled", "activate")).toThrow(/Invalid subscription transition/);
    expect(getNextSubscriptionStatus("past_due", "recover")).toBe("active");
  });

  it("does not restore mutation access after subscription suspension or expiry", () => {
    for (const status of ["suspended", "cancelled", "expired"] as const) {
      const result = evaluateSubscriptionLifecycle({ status, currentPeriodEnd: new Date("2030-02-01") }, new Date("2030-01-01"));
      expect(result.access).toBe("none");
      expect(result.mutationsAllowed).toBe(false);
    }
  });
});
