import mongoose from "mongoose";
import { TenantLimit, TenantUsage } from "../models/index.js";
import type { UsageDimension } from "../models/TenantUsage.js";
import { AppError } from "../utils/errors.js";

const INITIAL_COUNTERS = { students: 0, school_users: 0, storage_bytes: 0 };

function assertTenant(schoolId: string): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(schoolId)) throw AppError.badRequest("Invalid tenant id");
  return new mongoose.Types.ObjectId(schoolId);
}

function assertDelta(delta: number): void {
  if (!Number.isSafeInteger(delta) || delta === 0) throw AppError.badRequest("Usage delta must be a non-zero safe integer");
}

export async function incrementTenantUsage(schoolId: string, dimension: UsageDimension, delta: number) {
  const tenantId = assertTenant(schoolId);
  assertDelta(delta);
  await TenantUsage.updateOne({ schoolId: tenantId }, { $setOnInsert: { schoolId: tenantId, counters: INITIAL_COUNTERS } }, { upsert: true });

  const counterPath = `counters.${dimension}`;
  const limit = await TenantLimit.findOne({ schoolId: tenantId, dimension }).select("limit").lean();
  const filter: Record<string, unknown> = { schoolId: tenantId };
  if (delta > 0 && limit) filter[counterPath] = { $lte: limit.limit - delta };
  if (delta < 0) filter[counterPath] = { $gte: -delta };

  const usage = await TenantUsage.findOneAndUpdate(filter, { $inc: { [counterPath]: delta } }, { new: true }).lean();
  if (!usage) {
    if (limit && delta > 0) throw AppError.conflict(`Tenant ${dimension} limit exceeded`);
    throw AppError.conflict(`Tenant ${dimension} usage cannot become negative`);
  }
  return usage;
}

export async function getTenantUsage(schoolId: string) {
  const tenantId = assertTenant(schoolId);
  const [usage, limits] = await Promise.all([
    TenantUsage.findOne({ schoolId: tenantId }).lean(),
    TenantLimit.find({ schoolId: tenantId }).select("dimension limit updatedAt").sort({ dimension: 1 }).lean(),
  ]);
  return { schoolId: tenantId.toString(), counters: usage?.counters ?? INITIAL_COUNTERS, limits };
}

export async function setTenantLimit(schoolId: string, dimension: UsageDimension, limit: number) {
  const tenantId = assertTenant(schoolId);
  if (!Number.isSafeInteger(limit) || limit < 0) throw AppError.badRequest("Usage limit must be a non-negative safe integer");
  const current = await TenantUsage.findOne({ schoolId: tenantId }).select(`counters.${dimension}`).lean();
  const currentValue = Number(current?.counters?.[dimension] ?? 0);
  if (limit < currentValue) throw AppError.conflict(`Limit cannot be below current ${dimension} usage`);
  return TenantLimit.findOneAndUpdate({ schoolId: tenantId, dimension }, { $set: { limit } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
}
