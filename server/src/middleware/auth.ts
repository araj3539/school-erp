import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/index.js";
import { UserRole } from "@school-erp/shared";

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
  schoolId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
    }
  }
}

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const accessToken = req.cookies?.[ACCESS_TOKEN_COOKIE];
  if (!accessToken) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const payload = jwt.verify(accessToken, env.JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const accessToken = req.cookies?.[ACCESS_TOKEN_COOKIE];
  if (!accessToken) {
    next();
    return;
  }
  try {
    const payload = jwt.verify(accessToken, env.JWT_SECRET) as AuthPayload;
    req.user = payload;
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}
