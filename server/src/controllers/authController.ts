import { Request, Response, NextFunction } from "express";
import { User, IUser } from "../models/index.js";
import { CreateUserSchema, LoginSchema, ChangePasswordSchema, RefreshTokenSchema } from "../validators/index.js";
import { generateAccessToken, generateRefreshToken, hashPassword, comparePassword, setAuthCookies, clearAuthCookies, verifyRefreshToken } from "../services/auth.js";
import { createAuditLog } from "../services/auditLog.js";
import { AppError } from "../utils/errors.js";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateUserSchema.parse({ ...req.body, schoolId: req.user!.schoolId });
    const existingUser = await User.findOne({ email: data.email, schoolId: data.schoolId });
    if (existingUser) throw AppError.conflict("Email already registered");
    const passwordHash = await hashPassword(data.password);
    const user = await User.create({ ...data, passwordHash });
    await createAuditLog({ userId: user._id.toString(), action: "CREATE", entity: "User", entityId: user._id.toString(), after: { email: user.email, role: user.role } });
    const payload = { userId: user._id.toString(), email: user.email, role: user.role, schoolId: user.schoolId.toString() };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    setAuthCookies(res, accessToken, refreshToken);
    res.status(201).json({ user: { id: user._id, email: user.email, role: user.role, schoolId: user.schoolId }, accessToken });
  } catch (error) { next(error); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = LoginSchema.parse(req.body);
    console.info("[AUTH] Login attempt", { email: data.email });

    let user: (IUser & { passwordHash: string }) | null;
    try {
      user = await User.findOne({ email: data.email }).select("+passwordHash") as (IUser & { passwordHash: string }) | null;
    } catch (error) {
      console.error("[AUTH] User lookup failed", { name: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : String(error) });
      throw error;
    }

    if (!user || !user.isActive) {
      console.info("[AUTH] Login rejected: user missing or inactive", { email: data.email, userFound: Boolean(user), active: user?.isActive ?? false });
      res.status(401).json({ error: "Invalid credentials", code: "UNAUTHORIZED" });
      return;
    }

    let isValid: boolean;
    try {
      isValid = await comparePassword(data.password, user.passwordHash);
    } catch (error) {
      console.error("[AUTH] Password comparison failed", { name: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : String(error) });
      throw error;
    }

    if (!isValid) {
      console.info("[AUTH] Login rejected: invalid password", { email: data.email });
      res.status(401).json({ error: "Invalid credentials", code: "UNAUTHORIZED" });
      return;
    }

    try {
      user.lastLogin = new Date();
      await user.save();
    } catch (error) {
      console.error("[AUTH] Failed to update lastLogin", { name: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : String(error) });
      throw error;
    }

    const payload = { userId: user._id.toString(), email: user.email, role: user.role, schoolId: user.schoolId.toString() };
    let accessToken: string;
    let refreshToken: string;
    try {
      accessToken = generateAccessToken(payload);
      refreshToken = generateRefreshToken(payload);
    } catch (error) {
      console.error("[AUTH] Token generation failed", { name: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : String(error) });
      throw error;
    }

    try {
      setAuthCookies(res, accessToken, refreshToken);
    } catch (error) {
      console.error("[AUTH] Setting auth cookies failed", { name: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message : String(error) });
      throw error;
    }

    await createAuditLog({ userId: user._id.toString(), action: "LOGIN", entity: "User", entityId: user._id.toString() });
    console.info("[AUTH] Login successful", { email: user.email, userId: user._id.toString() });
    res.json({ user: { id: user._id, email: user.email, role: user.role, schoolId: user.schoolId }, accessToken });
  } catch (error) { next(error); }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    // Prefer the httpOnly refresh cookie. Keep accepting the request body for
    // backwards compatibility with existing clients.
    const refreshToken = req.cookies?.refresh_token ?? RefreshTokenSchema.parse(req.body ?? {}).refreshToken;
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) throw AppError.unauthorized("User not found or inactive");
    const newPayload = { userId: user._id.toString(), email: user.email, role: user.role, schoolId: user.schoolId.toString() };
    const accessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);
    setAuthCookies(res, accessToken, newRefreshToken);
    res.json({ accessToken });
  } catch (error) { next(error); }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user) await createAuditLog({ userId: req.user.userId, action: "LOGOUT", entity: "User", entityId: req.user.userId });
    clearAuthCookies(res);
    res.json({ message: "Logged out successfully" });
  } catch (error) { next(error); }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized();
    const user = await User.findById(req.user.userId).populate("schoolId");
    if (!user) throw AppError.notFound("User not found");
    res.json({ user: { id: user._id, email: user.email, role: user.role, schoolId: user.schoolId, lastLogin: user.lastLogin } });
  } catch (error) { next(error); }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized();
    const data = ChangePasswordSchema.parse(req.body);
    const user = await User.findById(req.user.userId).select("+passwordHash");
    if (!user) throw AppError.notFound("User not found");
    const isValid = await comparePassword(data.currentPassword, user.passwordHash);
    if (!isValid) throw AppError.badRequest("Current password is incorrect");
    user.passwordHash = await hashPassword(data.newPassword);
    await user.save();
    await createAuditLog({ userId: user._id.toString(), action: "CHANGE_PASSWORD", entity: "User", entityId: user._id.toString() });
    res.json({ message: "Password changed successfully" });
  } catch (error) { next(error); }
}
