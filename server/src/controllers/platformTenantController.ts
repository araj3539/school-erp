import mongoose from "mongoose";
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
  const session = await mongoose.startSession();
  try {
    const tenantId = (req.validatedParams as { id: string }).id;
    const { status, reason } = req.body as { status: "active" | "suspended" | "archived"; reason: string };
    let result: Record<string, unknown> | undefined;
    let idempotentReplay = false;

    await session.withTransaction(async () => {
      const school = await School.findById(tenantId).session(session);
      if (!school) { throw Object.assign(new Error("Tenant not found"), { statusCode: 404 }); }
      const before = { tenantStatus: school.tenantStatus, suspendedAt: school.suspendedAt, archivedAt: school.archivedAt };
      assertTenantTransition(school.tenantStatus, status);
      idempotentReplay = school.tenantStatus === status;
      if (!idempotentReplay) {
        school.tenantStatus = status;
        const timestamps = nextTenantTimestamps(status);
        school.suspendedAt = timestamps.suspendedAt;
        school.archivedAt = timestamps.archivedAt;
        await school.save({ session });
      }
      await createAuditLog({
        userId: req.user!.userId,
        schoolId: school._id.toString(),
        action: "TENANT_LIFECYCLE_CHANGE",
        entity: "School",
        entityId: school._id.toString(),
        before,
        after: { tenantStatus: school.tenantStatus, suspendedAt: school.suspendedAt, archivedAt: school.archivedAt, reason, idempotentReplay },
        ip: req.ip,
        userAgent: req.get("user-agent"),
        session,
      });
      result = school.toObject() as Record<string, unknown>;
    });

    res.json({ data: result, idempotentReplay });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error && (error as { statusCode?: number }).statusCode === 404) {
      res.status(404).json({ error: "Tenant not found" }); return;
    }
    next(error);
  } finally {
    await session.endSession();
  }
}
