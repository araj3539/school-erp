import { Request, Response, NextFunction } from "express";
import { ROLE_PERMISSIONS, UserRole } from "@school-erp/shared";
import { requireActiveTenant } from "./tenantLifecycle.js";

export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const userPermissions = ROLE_PERMISSIONS[req.user.role as keyof typeof ROLE_PERMISSIONS] || [];
    if (!(userPermissions.includes("*") || userPermissions.includes(permission))) {
      res.status(403).json({ error: `Permission required: ${permission}` });
      return;
    }
    await requireActiveTenant(req, res, next);
  };
}

export function requireAnyPermission(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const userPermissions = ROLE_PERMISSIONS[req.user.role as keyof typeof ROLE_PERMISSIONS] || [];
    if (!(userPermissions.includes("*") || permissions.some((p) => userPermissions.includes(p)))) {
      res.status(403).json({ error: `One of permissions required: ${permissions.join(", ")}` });
      return;
    }
    await requireActiveTenant(req, res, next);
  };
}

export function requireOwnership(getResourceUserId: (req: Request) => string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const resourceUserId = getResourceUserId(req);
    if (!(req.user.role === "super_admin" || req.user.userId === resourceUserId)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    if (req.user.role === UserRole.SUPER_ADMIN) {
      await requireActiveTenant(req, res, next);
      return;
    }
    next();
  };
}
