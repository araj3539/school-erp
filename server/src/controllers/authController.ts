import { Request, Response, NextFunction } from "express";
import { User, IUser, School } from "../models/index.js";
import { CreateUserSchema, LoginSchema, ChangePasswordSchema, RefreshTokenSchema } from "../validators/index.js";
import { generateAccessToken, generateRefreshToken, hashPassword, comparePassword, setAuthCookies, clearAuthCookies, verifyRefreshToken } from "../services/auth.js";
import { createAuditLog } from "../services/auditLog.js";
import { AppError } from "../utils/errors.js";

function normalizeSchoolCode(value: unknown): string {
  const code = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!/^[A-Z0-9-]{3,30}$/.test(code)) throw AppError.badRequest("Invalid school code");
  return code;
}
function schoolCodeFromId(id: { toString(): string }) { return `SCH-${id.toString().slice(-8).toUpperCase()}`; }

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateUserSchema.parse({ ...req.body, schoolId: req.user!.schoolId });
    if (await User.findOne({ email: data.email, schoolId: data.schoolId })) throw AppError.conflict("Email already registered");
    const user = await User.create({ ...data, passwordHash: await hashPassword(data.password) });
    await createAuditLog({ schoolId: user.schoolId.toString(), userId: user._id.toString(), action: "CREATE", entity: "User", entityId: user._id.toString(), after: { email: user.email, role: user.role } });
    const payload = { userId: user._id.toString(), email: user.email, role: user.role, schoolId: user.schoolId.toString() };
    const accessToken = generateAccessToken(payload), refreshToken = generateRefreshToken(payload);
    setAuthCookies(res, accessToken, refreshToken);
    res.status(201).json({ user: { id: user._id, email: user.email, role: user.role, schoolId: user.schoolId }, accessToken });
  } catch (error) { next(error); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const credentials = LoginSchema.parse(req.body);
    const schoolCode = normalizeSchoolCode(req.body?.schoolCode);
    let school = await School.findOne({ code: schoolCode }).select("_id code");
    if (!school) {
      const legacySchools = await School.find({ $or: [{ code: { $exists: false } }, { code: null }] }).select("_id code");
      school = legacySchools.find((candidate) => schoolCodeFromId(candidate._id) === schoolCode) || null;
      if (school) { school.code = schoolCode; await school.save(); }
    }
    if (!school) { res.status(401).json({ error: "Invalid credentials", code: "UNAUTHORIZED" }); return; }

    const user = await User.findOne({ email: credentials.email, schoolId: school._id }).select("+passwordHash") as (IUser & { passwordHash: string }) | null;
    if (!user || !user.isActive || !(await comparePassword(credentials.password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid credentials", code: "UNAUTHORIZED" }); return;
    }
    user.lastLogin = new Date();
    await user.save();
    const payload = { userId: user._id.toString(), email: user.email, role: user.role, schoolId: user.schoolId.toString() };
    const accessToken = generateAccessToken(payload), refreshToken = generateRefreshToken(payload);
    setAuthCookies(res, accessToken, refreshToken);
    await createAuditLog({ schoolId: user.schoolId.toString(), userId: user._id.toString(), action: "LOGIN", entity: "User", entityId: user._id.toString() });
    res.json({ user: { id: user._id, email: user.email, role: user.role, schoolId: user.schoolId }, accessToken });
  } catch (error) { next(error); }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refresh_token ?? RefreshTokenSchema.parse(req.body ?? {}).refreshToken;
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findOne({ _id: payload.userId, schoolId: payload.schoolId });
    if (!user || !user.isActive) throw AppError.unauthorized("User not found or inactive");
    const newPayload = { userId: user._id.toString(), email: user.email, role: user.role, schoolId: user.schoolId.toString() };
    const accessToken = generateAccessToken(newPayload), newRefreshToken = generateRefreshToken(newPayload);
    setAuthCookies(res, accessToken, newRefreshToken);
    res.json({ accessToken });
  } catch (error) { next(error); }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try { if (req.user) await createAuditLog({ schoolId: req.user.schoolId, userId: req.user.userId, action: "LOGOUT", entity: "User", entityId: req.user.userId }); clearAuthCookies(res); res.json({ message: "Logged out successfully" }); } catch (error) { next(error); }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try { if (!req.user) throw AppError.unauthorized(); const user = await User.findOne({ _id: req.user.userId, schoolId: req.user.schoolId }).populate("schoolId"); if (!user) throw AppError.notFound("User not found"); res.json({ user: { id: user._id, email: user.email, role: user.role, schoolId: user.schoolId, lastLogin: user.lastLogin } }); } catch (error) { next(error); }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized();
    const data = ChangePasswordSchema.parse(req.body);
    const user = await User.findOne({ _id: req.user.userId, schoolId: req.user.schoolId }).select("+passwordHash");
    if (!user) throw AppError.notFound("User not found");
    if (!(await comparePassword(data.currentPassword, user.passwordHash))) throw AppError.badRequest("Current password is incorrect");
    user.passwordHash = await hashPassword(data.newPassword); await user.save();
    await createAuditLog({ schoolId: user.schoolId.toString(), userId: user._id.toString(), action: "CHANGE_PASSWORD", entity: "User", entityId: user._id.toString() });
    res.json({ message: "Password changed successfully" });
  } catch (error) { next(error); }
}
