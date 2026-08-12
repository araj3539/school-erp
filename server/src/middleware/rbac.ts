import { Request, Response, NextFunction } from "express";
import { ROLE_PERMISSIONS, UserRole } from "@school-erp/shared";

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const userPermissions = ROLE_PERMISSIONS[req.user.role as keyof typeof ROLE_PERMISSIONS] || [];
    if (userPermissions.includes("*") || userPermissions.includes(permission)) {
      next();
      return;
    }
    res.status(403).json({ error: `Permission required: ${permission}` });
  };
}

export function requireAnyPermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const userPermissions = ROLE_PERMISSIONS[req.user.role as keyof typeof ROLE_PERMISSIONS] || [];
    if (userPermissions.includes("*") || permissions.some((p) => userPermissions.includes(p))) {
      next();
      return;
    }
    res.status(403).json({ error: `One of permissions required: ${permissions.join(", ")}` });
  };
}

export function requireOwnership(getResourceUserId: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const resourceUserId = getResourceUserId(req);
    if (req.user.role === "super_admin" || req.user.userId === resourceUserId) {
      next();
      return;
    }
    res.status(403).json({ error: "Access denied" });
  };
}
