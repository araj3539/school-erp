import { Request, Response, NextFunction } from "express";
import { getModuleEntitlements, setModuleEntitlement } from "../services/moduleEntitlement.js";

export async function getModuleEntitlementsController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.schoolId) { res.status(403).json({ error: "Tenant context required" }); return; }
    res.json({ data: await getModuleEntitlements(req.user.schoolId) });
  } catch (error) { next(error); }
}

export async function setModuleEntitlementController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schoolId = req.params.schoolId;
    const moduleId = req.params.moduleId;
    const result = await setModuleEntitlement(schoolId, moduleId, req.body.enabled, req.user!.userId, req.ip, req.get("user-agent"));
    res.json({ data: result });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      const statusCode = (error as { statusCode?: unknown }).statusCode;
      if (statusCode === 400 || statusCode === 404) {
        res.status(statusCode).json({ error: error instanceof Error ? error.message : "Invalid module entitlement request" });
        return;
      }
    }
    next(error);
  }
}
