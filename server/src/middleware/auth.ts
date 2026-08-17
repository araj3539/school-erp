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

function getAccessToken(req: Request): string | undefined {
  const cookieToken = req.cookies?.[ACCESS_TOKEN_COOKIE];
  if (cookieToken) return cookieToken;

  const authorization = req.get("Authorization");
  if (!authorization) return undefined;

  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return undefined;
  return token;
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const accessToken = getAccessToken(req);
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
  const accessToken = getAccessToken(req);
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
