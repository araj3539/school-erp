import { Request, Response, NextFunction } from "express";
import { getJobHistory } from "../services/scheduledJobService.js";
import { getTenantId } from "../utils/tenant.js";

export async function listScheduledJobs(req: Request, res: Response, next: NextFunction) {
  try { res.json({ jobs: await getJobHistory(getTenantId(req), Number(req.query.limit ?? 100)) }); } catch (e) { next(e); }
}
