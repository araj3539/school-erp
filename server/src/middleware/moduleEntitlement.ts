import { Request, Response, NextFunction } from "express";
import { UserRole } from "@school-erp/shared";
import { isModuleEnabled, ModuleId } from "../services/moduleEntitlement.js";

export function requireModule(moduleId: ModuleId) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
    if (req.user.role === UserRole.SUPER_ADMIN && !req.user.schoolId) { next(); return; }
    if (!req.user.schoolId) { res.status(403).json({ error: "Tenant context required" }); return; }
    try {
      if (!(await isModuleEnabled(req.user.schoolId, moduleId))) {
        res.status(403).json({ error: "Module is disabled for this tenant", code: "MODULE_DISABLED", moduleId });
        return;
      }
      next();
    } catch (error) { next(error); }
  };
}
