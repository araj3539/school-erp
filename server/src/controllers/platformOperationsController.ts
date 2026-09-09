import { Request, Response, NextFunction } from "express";
import { getPlatformOperationsOverview, listPlatformAuditLogs } from "../services/platformOperations.js";

export async function getPlatformOperationsOverviewController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await getPlatformOperationsOverview() });
  } catch (error) {
    next(error);
  }
}

export async function listPlatformAuditLogsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.validatedQuery as {
      schoolId?: string;
      userId?: string;
      action?: string;
      entity?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    };
    const data = await listPlatformAuditLogs({
      ...query,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });
    res.json({ data });
  } catch (error) {
    next(error);
  }
}
