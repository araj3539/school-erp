import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";
import { getAnalyticsDataset, validateAnalyticsRange } from "../services/analyticsService.js";
import { getAiStatus, getAnalyticsInsights } from "../services/aiProviderService.js";

export async function getAnalyticsOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const range = validateAnalyticsRange(req.query.range);
    const dataset = await getAnalyticsDataset(getTenantId(req), range);
    res.json(dataset);
  } catch (error) {
    if (error instanceof Error && error.message === "No current academic year set") {
      return next(AppError.badRequest(error.message));
    }
    if (error instanceof Error && error.message.startsWith("Analytics range must")) {
      return next(AppError.badRequest(error.message));
    }
    next(error);
  }
}

export async function getAnalyticsAiStatus(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(getAiStatus());
  } catch (error) { next(error); }
}

export async function getAnalyticsAiInsights(req: Request, res: Response, next: NextFunction) {
  try {
    const range = validateAnalyticsRange(req.query.range);
    const dataset = await getAnalyticsDataset(getTenantId(req), range);
    const result = await getAnalyticsInsights(dataset);
    res.json({ ...result, generatedAt: dataset.generatedAt, sources: dataset });
  } catch (error) {
    if (error instanceof Error && error.message === "No current academic year set") {
      return next(AppError.badRequest(error.message));
    }
    if (error instanceof Error && error.message.startsWith("Analytics range must")) {
      return next(AppError.badRequest(error.message));
    }
    next(error);
  }
}
