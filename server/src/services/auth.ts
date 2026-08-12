import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "../config/index.js";
import { UserRole } from "@school-erp/shared";
import { SignOptions } from "jsonwebtoken";

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  schoolId: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY as SignOptions["expiresIn"] });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY as SignOptions["expiresIn"] });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

export function setAuthCookies(res: any, accessToken: string, refreshToken: string): void {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000
  });
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export function clearAuthCookies(res: any): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax" });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax" });
}
