import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { School } from "../models/index.js";
import { createAuditLog } from "../services/auditLog.js";
import { assertTenantTransition, nextTenantTimestamps } from "../services/tenantLifecycle.js";

export async function listPlatformTenants(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const query = status
      ? status === "active"
        ? { $or: [{ tenantStatus: "active" }, { tenantStatus: { $exists: false } }] }
        : { tenantStatus: status }
      : {};
    const tenants = await School.find(query)
      .select("code name email phone session tenantStatus suspendedAt archivedAt createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ data: tenants.map((tenant) => ({ ...tenant, tenantStatus: tenant.tenantStatus ?? "active" })) });
  } catch (error) { next(error); }
}

export async function updatePlatformTenantLifecycle(req: Request, res: Response, next: NextFunction): Promise<void> {
  const session = await mongoose.startSession();
  try {
    const tenantId = (req.validatedParams as { id: string }).id;
    const { status, reason } = req.body as { status: "active" | "suspended" | "archived"; reason: string };
    let response: unknown;
    await session.withTransaction(async () => {
      const school = await School.findById(tenantId).session(session);
      if (!school) { throw new mongoose.Error.DocumentNotFoundError(null); }
      const currentStatus = school.tenantStatus ?? "active";
      const before = { tenantStatus: currentStatus, suspendedAt: school.suspendedAt, archivedAt: school.archivedAt };
      assertTenantTransition(currentStatus, status);
      if (currentStatus === status) {
        response = { data: { ...school.toObject(), tenantStatus: currentStatus }, idempotentReplay: true };
        return;
      }
      school.tenantStatus = status;
      const timestamps = nextTenantTimestamps(status);
      school.suspendedAt = timestamps.suspendedAt;
      school.archivedAt = timestamps.archivedAt;
      await school.save({ session });
      await createAuditLog({
        userId: req.user!.userId,
        schoolId: school._id.toString(),
        action: "TENANT_LIFECYCLE_CHANGE",
        entity: "School",
        entityId: school._id.toString(),
        before,
        after: { tenantStatus: status, suspendedAt: school.suspendedAt, archivedAt: school.archivedAt, reason },
        ip: req.ip,
        userAgent: req.get("user-agent"),
        session,
      });
      response = { data: school.toObject() };
    });
    res.json(response);
  } catch (error) {
    if (error instanceof mongoose.Error.DocumentNotFoundError) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }
    next(error);
  } finally {
    await session.endSession();
  }
}
