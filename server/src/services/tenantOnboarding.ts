import crypto from "node:crypto";
import mongoose from "mongoose";
import { AcademicYear, School, TenantProvisioning, User } from "../models/index.js";
import { createAuditLog } from "./auditLog.js";
import { hashPassword } from "./auth.js";
import type { TenantOnboardingInput } from "../validators/tenantOnboardingValidators.js";

function fingerprint(input: TenantOnboardingInput): string {
  const canonical = JSON.stringify({
    name: input.name,
    address: input.address,
    phone: input.phone,
    email: input.email,
    session: input.session,
    academicYear: input.academicYear,
    adminEmail: input.admin.email,
  });
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

function isDuplicateKey(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: number }).code === 11000);
}

export interface TenantOnboardingResult {
  idempotentReplay: boolean;
  school: { id: string; code: string; name: string; tenantStatus: string };
  academicYear: { id: string; name: string };
  admin: { id: string; email: string; role: string };
}

async function resultFromProvisioning(provisioning: { schoolId: mongoose.Types.ObjectId; academicYearId: mongoose.Types.ObjectId; adminUserId: mongoose.Types.ObjectId }, idempotentReplay: boolean): Promise<TenantOnboardingResult> {
  const [school, academicYear, admin] = await Promise.all([
    School.findById(provisioning.schoolId).select("code name tenantStatus").lean(),
    AcademicYear.findById(provisioning.academicYearId).select("name").lean(),
    User.findById(provisioning.adminUserId).select("email role").lean(),
  ]);
  if (!school || !academicYear || !admin) throw new Error("Provisioning record references missing bootstrap data");
  return {
    idempotentReplay,
    school: { id: school._id.toString(), code: school.code, name: school.name, tenantStatus: school.tenantStatus },
    academicYear: { id: academicYear._id.toString(), name: academicYear.name },
    admin: { id: admin._id.toString(), email: admin.email, role: admin.role },
  };
}

export async function provisionTenant(input: TenantOnboardingInput, actorUserId: string, ip?: string, userAgent?: string): Promise<TenantOnboardingResult> {
  const requestFingerprint = fingerprint(input);
  const existing = await TenantProvisioning.findOne({ idempotencyKey: input.idempotencyKey }).lean();
  if (existing) {
    if (existing.requestFingerprint !== requestFingerprint) throw Object.assign(new Error("Idempotency key was already used with different tenant data"), { statusCode: 409 });
    return resultFromProvisioning(existing, true);
  }

  const session = await mongoose.startSession();
  try {
    let provisioning: { schoolId: mongoose.Types.ObjectId; academicYearId: mongoose.Types.ObjectId; adminUserId: mongoose.Types.ObjectId } | undefined;
    await session.withTransaction(async () => {
      const academicYearId = new mongoose.Types.ObjectId();
      const school = new School({
        name: input.name,
        address: input.address,
        phone: input.phone,
        email: input.email,
        session: input.session,
        academicYear: academicYearId,
        settings: {},
        tenantStatus: "active",
      });
      await school.save({ session });

      const academicYear = new AcademicYear({
        _id: academicYearId,
        name: input.academicYear.name,
        startDate: new Date(input.academicYear.startDate),
        endDate: new Date(input.academicYear.endDate),
        isCurrent: true,
        schoolId: school._id,
      });
      await academicYear.save({ session });

      const admin = new User({
        email: input.admin.email,
        passwordHash: await hashPassword(input.admin.password),
        role: "principal",
        schoolId: school._id,
        isActive: true,
      });
      await admin.save({ session });

      await TenantProvisioning.create([{
        idempotencyKey: input.idempotencyKey,
        requestFingerprint,
        schoolId: school._id,
        academicYearId,
        adminUserId: admin._id,
        status: "completed",
      }], { session });

      await createAuditLog({
        userId: actorUserId,
        schoolId: school._id.toString(),
        action: "TENANT_PROVISION",
        entity: "School",
        entityId: school._id.toString(),
        after: {
          code: school.code,
          name: school.name,
          tenantStatus: school.tenantStatus,
          academicYearId: academicYear._id.toString(),
          adminUserId: admin._id.toString(),
          idempotencyKey: input.idempotencyKey,
        },
        ip,
        userAgent,
        session,
      });

      provisioning = { schoolId: school._id, academicYearId, adminUserId: admin._id };
    });

    if (!provisioning) throw new Error("Tenant provisioning completed without a provisioning record");
    return resultFromProvisioning(provisioning, false);
  } catch (error) {
    if (isDuplicateKey(error)) {
      const replay = await TenantProvisioning.findOne({ idempotencyKey: input.idempotencyKey }).lean();
      if (replay) {
        if (replay.requestFingerprint !== requestFingerprint) throw Object.assign(new Error("Idempotency key was already used with different tenant data"), { statusCode: 409 });
        return resultFromProvisioning(replay, true);
      }
    }
    throw error;
  } finally {
    await session.endSession();
  }
}
