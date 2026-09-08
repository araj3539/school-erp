import { TenantStatus } from "../models/School.js";
import { AppError } from "../utils/errors.js";

const TRANSITIONS: Record<TenantStatus, readonly TenantStatus[]> = {
  active: ["suspended", "archived"],
  suspended: ["active", "archived"],
  archived: []
};

export function assertTenantTransition(from: TenantStatus, to: TenantStatus): void {
  if (from === to) return;
  if (!TRANSITIONS[from]?.includes(to)) {
    throw AppError.conflict(`Tenant cannot transition from ${from} to ${to}`);
  }
}

export function nextTenantTimestamps(status: TenantStatus, now = new Date()): { suspendedAt?: Date; archivedAt?: Date } {
  if (status === "suspended") return { suspendedAt: now, archivedAt: undefined };
  if (status === "archived") return { archivedAt: now };
  return { suspendedAt: undefined, archivedAt: undefined };
}
