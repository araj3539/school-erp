import { Request, Response, NextFunction } from "express";
import type { UsageDimension } from "../models/TenantUsage.js";
import { incrementTenantUsage } from "../services/tenantUsage.js";
import { getTenantId } from "../utils/tenant.js";

export function reserveTenantUsage(dimension: UsageDimension, delta = 1) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let reserved = false;
    try {
      const schoolId = getTenantId(req);
      await incrementTenantUsage(schoolId, dimension, delta);
      reserved = true;
      res.once("finish", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          void incrementTenantUsage(schoolId, dimension, -delta).catch(() => undefined);
        }
      });
      next();
    } catch (error) {
      if (reserved) {
        const schoolId = getTenantId(req);
        void incrementTenantUsage(schoolId, dimension, -delta).catch(() => undefined);
      }
      next(error);
    }
  };
}
