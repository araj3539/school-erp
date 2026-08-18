import { ClientSession } from "mongoose";
import { AuditLog, IAuditLog } from "../models/index.js";

export async function createAuditLog(data: {
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
  try {
    const { session, ...auditData } = data;
    if (session) {
      await AuditLog.create([auditData], { session });
    } else {
      await AuditLog.create(auditData);
    }
  } catch (error) {
    console.error("Failed to create audit log:", error);
    throw error;
  }
}

export async function getAuditLogs(filters: {
  userId?: string;
  entity?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}): Promise<{ logs: IAuditLog[]; total: number }> {
  const query: any = {};
  if (filters.userId) query.userId = filters.userId;
  if (filters.entity) query.entity = filters.entity;
  if (filters.entityId) query.entityId = filters.entityId;
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = filters.startDate;
    if (filters.endDate) query.createdAt.$lte = filters.endDate;
  }
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;
  const logs = await AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec();
  const total = await AuditLog.countDocuments(query);
  return { logs: logs as unknown as IAuditLog[], total };
}
