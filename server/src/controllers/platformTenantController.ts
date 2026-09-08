import { Request, Response, NextFunction } from "express";
import { School } from "../models/index.js";
import { createAuditLog } from "../services/auditLog.js";
import { assertTenantTransition, nextTenantTimestamps } from "../services/tenantLifecycle.js";

export async function listPlatformTenants(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const query = status ? { tenantStatus: status } : {};
    const tenants = await School.find(query).select("code name email phone session tenantStatus suspendedAt archivedAt createdAt updatedAt").sort({ createdAt: -1 }).lean();
    res.json({ data: tenants });
  } catch (error) { next(error); }
}

export async function updatePlatformTenantLifecycle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = (req.validatedParams as { id: string }).id;
    const { status, reason } = req.body as { status: "active" | "suspended" | "archived"; reason: string };
    const school = await School.findById(tenantId);
    if (!school) { res.status(404).json({ error: "Tenant not found" }); return; }
    const before = { tenantStatus: school.tenantStatus, suspendedAt: school.suspendedAt, archivedAt: school.archivedAt };
    assertTenantTransition(school.tenantStatus, status);
    if (school.tenantStatus === status) { res.json({ data: school.toObject(), idempotentReplay: true }); return; }
    school.tenantStatus = status;
    const timestamps = nextTenantTimestamps(status);
    school.suspendedAt = timestamps.suspendedAt;
    school.archivedAt = timestamps.archivedAt;
    await school.save();
    await createAuditLog({ userId: req.user!.userId, schoolId: school._id.toString(), action: "TENANT_LIFECYCLE_CHANGE", entity: "School", entityId: school._id.toString(), before, after: { tenantStatus: status, suspendedAt: school.suspendedAt, archivedAt: school.archivedAt, reason }, ip: req.ip, userAgent: req.get("user-agent") });
    res.json({ data: school.toObject() });
  } catch (error) { next(error); }
}
