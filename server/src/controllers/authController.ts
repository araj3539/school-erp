import { Request, Response, NextFunction } from "express";
import { User, IUser, School } from "../models/index.js";
import { CreateUserSchema, LoginSchema, ChangePasswordSchema, RefreshTokenSchema } from "../validators/index.js";
import { generateAccessToken, generateRefreshToken, hashPassword, comparePassword, setAuthCookies, clearAuthCookies, verifyRefreshToken } from "../services/auth.js";
import { createAuditLog } from "../services/auditLog.js";
import { AppError } from "../utils/errors.js";
import { UserRole } from "@school-erp/shared";

function normalizeSchoolCode(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const code = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!/^[A-Z0-9-]{3,30}$/.test(code)) throw AppError.badRequest("Invalid school code");
  return code;
}
function schoolCodeFromId(id: { toString(): string }) { return `SCH-${id.toString().slice(-8).toUpperCase()}`; }
function tokenPayload(user: IUser) {
  return { userId: user._id.toString(), email: user.email, role: user.role, refreshTokenVersion: user.refreshTokenVersion ?? 0, ...(user.schoolId ? { schoolId: user.schoolId.toString() } : {}) };
}
function publicUser(user: IUser) { return { id: user._id, email: user.email, role: user.role, ...(user.schoolId ? { schoolId: user.schoolId } : {}), lastLogin: user.lastLogin }; }
async function getTenantSchools() {
  const schools = await School.find({}).select("_id name code").sort({ name: 1 }).lean();
  return schools.map((school: any) => ({ id: school._id.toString(), name: school.name, code: school.code }));
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.schoolId) throw AppError.forbidden("Only school administrators can register school users");
    const data = CreateUserSchema.parse({ ...req.body, schoolId: req.user.schoolId });
    if (data.role === UserRole.SUPER_ADMIN) throw AppError.forbidden("Super admin accounts cannot be created from a school context");
    if (await User.findOne({ email: data.email, schoolId: data.schoolId })) throw AppError.conflict("Email already registered");
    const user = await User.create({ ...data, passwordHash: await hashPassword(data.password) });
    await createAuditLog({ schoolId: user.schoolId!.toString(), userId: user._id.toString(), action: "CREATE", entity: "User", entityId: user._id.toString(), after: { email: user.email, role: user.role } });
    const payload = tokenPayload(user), accessToken = generateAccessToken(payload), refreshToken = generateRefreshToken(payload);
    setAuthCookies(res, accessToken, refreshToken);
    res.status(201).json({ user: publicUser(user), accessToken });
  } catch (error) { next(error); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const credentials = LoginSchema.parse(req.body);
    const schoolCode = normalizeSchoolCode(credentials.schoolCode);

    let user: (IUser & { passwordHash: string }) | null;
    if (!schoolCode) {
      user = await User.findOne({ email: credentials.email, role: UserRole.SUPER_ADMIN, schoolId: { $exists: false } }).select("+passwordHash") as (IUser & { passwordHash: string }) | null;
    } else {
      let school = await School.findOne({ code: schoolCode }).select("_id code");
      if (!school) {
        const legacySchools = await School.find({ $or: [{ code: { $exists: false } }, { code: null }] }).select("_id code");
        school = legacySchools.find((candidate) => schoolCodeFromId(candidate._id) === schoolCode) || null;
        if (school) { school.code = schoolCode; await school.save(); }
      }
      if (!school) { res.status(401).json({ error: "Invalid credentials", code: "UNAUTHORIZED" }); return; }
      user = await User.findOne({ email: credentials.email, schoolId: school._id, role: { $ne: UserRole.SUPER_ADMIN } }).select("+passwordHash") as (IUser & { passwordHash: string }) | null;
    }

    if (!user || !user.isActive || !(await comparePassword(credentials.password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid credentials", code: "UNAUTHORIZED" }); return;
    }
    if (user.role === UserRole.SUPER_ADMIN ? Boolean(user.schoolId) : !user.schoolId) {
      res.status(401).json({ error: "Invalid account configuration", code: "UNAUTHORIZED" }); return;
    }

    user.lastLogin = new Date(); await user.save();
    const payload = tokenPayload(user), accessToken = generateAccessToken(payload), refreshToken = generateRefreshToken(payload);
    setAuthCookies(res, accessToken, refreshToken);
    await createAuditLog({ ...(user.schoolId ? { schoolId: user.schoolId.toString() } : {}), userId: user._id.toString(), action: "LOGIN", entity: "User", entityId: user._id.toString() });
    const schools = user.role === UserRole.SUPER_ADMIN ? await getTenantSchools() : [];
    res.json({ user: publicUser(user), accessToken, ...(schools.length ? { schools, activeSchoolId: schools.length === 1 ? schools[0].id : null } : {}) });
  } catch (error) { next(error); }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refresh_token ?? RefreshTokenSchema.parse(req.body ?? {}).refreshToken;
    const payload = verifyRefreshToken(refreshToken);
    const expectedVersion = payload.refreshTokenVersion ?? 0;
    const filter = payload.role === UserRole.SUPER_ADMIN
      ? { _id: payload.userId, role: UserRole.SUPER_ADMIN, schoolId: { $exists: false }, refreshTokenVersion: expectedVersion, isActive: true }
      : { _id: payload.userId, schoolId: payload.schoolId, role: { $ne: UserRole.SUPER_ADMIN }, refreshTokenVersion: expectedVersion, isActive: true };
    const user = await User.findOneAndUpdate(filter, { $inc: { refreshTokenVersion: 1 } }, { new: true });
    if (!user) throw AppError.unauthorized("Refresh session is invalid or has already been rotated");
    const newPayload = tokenPayload(user), accessToken = generateAccessToken(newPayload), newRefreshToken = generateRefreshToken(newPayload);
    setAuthCookies(res, accessToken, newRefreshToken);
    res.json({ accessToken });
  } catch (error) { next(error); }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user.userId, { $inc: { refreshTokenVersion: 1 } });
      await createAuditLog({ ...(req.user.schoolId ? { schoolId: req.user.schoolId } : {}), userId: req.user.userId, action: "LOGOUT", entity: "User", entityId: req.user.userId });
    }
    clearAuthCookies(res); res.json({ message: "Logged out successfully" });
  } catch (error) { next(error); }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized();
    const filter = req.user.role === UserRole.SUPER_ADMIN
      ? { _id: req.user.userId, role: UserRole.SUPER_ADMIN, schoolId: { $exists: false } }
      : { _id: req.user.userId, schoolId: req.user.schoolId, role: { $ne: UserRole.SUPER_ADMIN } };
    const user = await User.findOne(filter).populate("schoolId");
    if (!user) throw AppError.notFound("User not found");
    const schools = user.role === UserRole.SUPER_ADMIN ? await getTenantSchools() : [];
    res.json({ user: publicUser(user), ...(schools.length ? { schools } : {}) });
  } catch (error) { next(error); }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized();
    const data = ChangePasswordSchema.parse(req.body);
    const filter = req.user.role === UserRole.SUPER_ADMIN
      ? { _id: req.user.userId, role: UserRole.SUPER_ADMIN, schoolId: { $exists: false } }
      : { _id: req.user.userId, schoolId: req.user.schoolId, role: { $ne: UserRole.SUPER_ADMIN } };
    const user = await User.findOne(filter).select("+passwordHash");
    if (!user) throw AppError.notFound("User not found");
    if (!(await comparePassword(data.currentPassword, user.passwordHash))) throw AppError.badRequest("Current password is incorrect");
    user.passwordHash = await hashPassword(data.newPassword); user.refreshTokenVersion += 1; await user.save();
    await createAuditLog({ ...(user.schoolId ? { schoolId: user.schoolId.toString() } : {}), userId: user._id.toString(), action: "CHANGE_PASSWORD", entity: "User", entityId: user._id.toString() });
    clearAuthCookies(res);
    res.json({ message: "Password changed successfully; other refresh sessions have been revoked" });
  } catch (error) { next(error); }
}
