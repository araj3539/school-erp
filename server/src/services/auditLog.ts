import { ClientSession } from "mongoose";
import { AuditLog, IAuditLog, User } from "../models/index.js";

export async function createAuditLog(data: {
  schoolId?: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  session?: ClientSession;
}): Promise<void> {
  const { session, schoolId, ...auditData } = data;
  try {
    let resolvedSchoolId = schoolId;

    if (!resolvedSchoolId) {
      const userQuery = User.findById(data.userId).select("schoolId");
      if (session) userQuery.session(session);
      const user = await userQuery.lean();
      if (!user?.schoolId) throw new Error("Cannot create audit log without a schoolId");
      resolvedSchoolId = user.schoolId.toString();
    }

    const record = { ...auditData, schoolId: resolvedSchoolId };
    if (session) await AuditLog.create([record], { session });
    else await AuditLog.create(record);
  } catch (error) {
    console.error("Failed to create audit log:", error);
    if (session) throw error;
  }
}

export async function getAuditLogs(filters: {
  schoolId: string;
  userId?: string;
  entity?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}): Promise<{ logs: IAuditLog[]; total: number }> {
  const query: Record<string, unknown> = { schoolId: filters.schoolId };
  if (filters.userId) query.userId = filters.userId;
  if (filters.entity) query.entity = filters.entity;
  if (filters.entityId) query.entityId = filters.entityId;
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) (query.createdAt as Record<string, Date>).$gte = filters.startDate;
    if (filters.endDate) (query.createdAt as Record<string, Date>).$lte = filters.endDate;
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;
  const logs = await AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec();
  const total = await AuditLog.countDocuments(query);
  return { logs: logs as unknown as IAuditLog[], total };
}
