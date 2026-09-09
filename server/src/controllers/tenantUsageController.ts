import { Request, Response, NextFunction } from "express";
import { getTenantUsage, setTenantLimit } from "../services/tenantUsage.js";

export async function getPlatformTenantUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { schoolId } = req.validatedParams as { schoolId: string };
    res.json({ data: await getTenantUsage(schoolId) });
  } catch (error) { next(error); }
}

export async function setPlatformTenantLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { schoolId, dimension } = req.validatedParams as { schoolId: string; dimension: "students" | "school_users" | "storage_bytes" };
    const { limit } = req.validatedBody as { limit: number };
    const data = await setTenantLimit(schoolId, dimension, limit);
    res.json({ data });
  } catch (error) { next(error); }
}
