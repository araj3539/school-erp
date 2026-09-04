import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { env } from "../config/index.js";
import { UserRole } from "@school-erp/shared";
import { School } from "../models/index.js";

export interface AuthPayload { userId: string; email: string; role: UserRole; schoolId?: string; }
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global { namespace Express { interface Request { user?: AuthPayload; file?: Express.Multer.File; files?: Express.Multer.File[]; } } }
const ACCESS_TOKEN_COOKIE = "access_token";
function getAccessToken(req: Request): string | undefined {
  const cookieToken = req.cookies?.[ACCESS_TOKEN_COOKIE];
  if (cookieToken) return cookieToken;
  const authorization = req.get("Authorization");
  if (!authorization) return undefined;
  const [scheme, token] = authorization.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : undefined;
}
function validatePayload(payload: AuthPayload): boolean {
  return payload.role === UserRole.SUPER_ADMIN ? !payload.schoolId : Boolean(payload.schoolId);
}
async function resolveRequestContext(req: Request, payload: AuthPayload): Promise<AuthPayload> {
  if (payload.role !== UserRole.SUPER_ADMIN) return payload;
  const selectedSchoolId = req.get("X-School-Id")?.trim();
  if (!selectedSchoolId) return payload;
  if (!mongoose.isValidObjectId(selectedSchoolId)) throw new Error("INVALID_SELECTED_SCHOOL");
  const schoolExists = await School.exists({ _id: selectedSchoolId });
  if (!schoolExists) throw new Error("UNKNOWN_SELECTED_SCHOOL");
  return { ...payload, schoolId: selectedSchoolId };
}
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const accessToken = getAccessToken(req);
  if (!accessToken) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const payload = jwt.verify(accessToken, env.JWT_SECRET) as AuthPayload;
    if (!validatePayload(payload)) { res.status(401).json({ error: "Invalid authentication context" }); return; }
    try {
      req.user = await resolveRequestContext(req, payload);
    } catch {
      res.status(400).json({ error: "Invalid selected school" }); return;
    }
    next();
  } catch { res.status(401).json({ error: "Invalid or expired token" }); }
}
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const accessToken = getAccessToken(req);
  if (!accessToken) { next(); return; }
  try {
    const payload = jwt.verify(accessToken, env.JWT_SECRET) as AuthPayload;
    if (validatePayload(payload)) req.user = await resolveRequestContext(req, payload);
  } catch {
    // Optional authentication deliberately falls back to an anonymous request.
  }
  next();
}
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) { res.status(401).json({ error: "Authentication required" }); return; }
    if (!roles.includes(req.user.role)) { res.status(403).json({ error: "Insufficient permissions" }); return; }
    next();
  };
}
