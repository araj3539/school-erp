import mongoose from "mongoose";
import { ModuleEntitlement, School } from "../models/index.js";
import { createAuditLog } from "./auditLog.js";

export const MODULES = {
  students: true,
  teachers: true,
  staff: true,
  academics: true,
  attendance: true,
  fees: true,
  exams: true,
  homework: true,
  library: true,
  transport: true,
  inventory: true,
  notices: true,
  timetable: true,
  notifications: true,
  parents: true,
  portal: true,
  dashboard: true,
  reports: true,
  school: true,
  academicYears: true,
} as const;

export type ModuleId = keyof typeof MODULES;

export function isModuleId(value: string): value is ModuleId {
  return Object.prototype.hasOwnProperty.call(MODULES, value);
}

export async function isModuleEnabled(schoolId: string, moduleId: string): Promise<boolean> {
  if (!isModuleId(moduleId)) return false;
  const entitlement = await ModuleEntitlement.findOne({ schoolId, moduleId }).select("enabled").lean();
  return entitlement?.enabled ?? MODULES[moduleId];
}

export async function getModuleEntitlements(schoolId: string) {
  const records = await ModuleEntitlement.find({ schoolId }).select("moduleId enabled -_id").lean();
  const overrides = new Map(records.map((record) => [record.moduleId, record.enabled]));
  return Object.entries(MODULES).map(([moduleId, defaultEnabled]) => ({
    moduleId,
    enabled: overrides.get(moduleId) ?? defaultEnabled,
    defaultEnabled,
  }));
}

export async function setModuleEntitlement(schoolId: string, moduleId: string, enabled: boolean, actorUserId: string, ip?: string, userAgent?: string) {
  if (!isModuleId(moduleId)) throw Object.assign(new Error("Unknown module"), { statusCode: 400 });
  if (!(await School.exists({ _id: schoolId }))) throw Object.assign(new Error("Unknown tenant"), { statusCode: 404 });

  const session = await mongoose.startSession();
  try {
    let resultEnabled = enabled;
    await session.withTransaction(async () => {
      const entitlement = await ModuleEntitlement.findOneAndUpdate(
        { schoolId, moduleId },
        { $set: { enabled } },
        { upsert: true, new: true, setDefaultsOnInsert: true, session },
      ).select("enabled -_id").lean();
      resultEnabled = entitlement?.enabled ?? enabled;
      await createAuditLog({
        userId: actorUserId,
        schoolId,
        action: "MODULE_ENTITLEMENT_UPDATE",
        entity: "ModuleEntitlement",
        entityId: `${schoolId}:${moduleId}`,
        after: { moduleId, enabled },
        ip,
        userAgent,
        session,
      });
    });
    return { moduleId, enabled: resultEnabled };
  } finally {
    await session.endSession();
  }
}
