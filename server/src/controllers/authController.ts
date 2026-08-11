import { Request, Response, NextFunction } from "express";
import { User, IUser } from "../models";
import { CreateUserSchema, LoginSchema, ChangePasswordSchema, RefreshTokenSchema } from "../validators";
import { generateAccessToken, generateRefreshToken, hashPassword, comparePassword, setAuthCookies, clearAuthCookies, verifyRefreshToken } from "../services/auth";
import { createAuditLog } from "../services/auditLog";
import { AppError } from "../utils/errors";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateUserSchema.parse(req.body);
    const existingUser = await User.findOne({ email: data.email, schoolId: data.schoolId });
    if (existingUser) {
      throw AppError.conflict("Email already registered");
    }
    const passwordHash = await hashPassword(data.password);
    const user = await User.create({
      ...data,
      passwordHash
    });
    await createAuditLog({
      userId: user._id.toString(),
      action: "CREATE",
      entity: "User",
      entityId: user._id.toString(),
      after: { email: user.email, role: user.role }
    });
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      schoolId: user.schoolId.toString()
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    setAuthCookies(res, accessToken, refreshToken);
    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId
      },
      accessToken
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = LoginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email }).select("+passwordHash");
    if (!user || !user.isActive) {
      throw AppError.unauthorized("Invalid credentials");
    }
    const isValid = await comparePassword(data.password, user.passwordHash);
    if (!isValid) {
      throw AppError.unauthorized("Invalid credentials");
    }
    user.lastLogin = new Date();
    await user.save();
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      schoolId: user.schoolId.toString()
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    setAuthCookies(res, accessToken, refreshToken);
    await createAuditLog({
      userId: user._id.toString(),
      action: "LOGIN",
      entity: "User",
      entityId: user._id.toString()
    });
    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId
      },
      accessToken
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const data = RefreshTokenSchema.parse(req.body);
    const payload = verifyRefreshToken(data.refreshToken);
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      throw AppError.unauthorized("User not found or inactive");
    }
    const newPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      schoolId: user.schoolId.toString()
    };
    const accessToken = generateAccessToken(newPayload);
    const refreshToken = generateRefreshToken(newPayload);
    setAuthCookies(res, accessToken, refreshToken);
    res.json({ accessToken });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user) {
      await createAuditLog({
        userId: req.user.userId,
        action: "LOGOUT",
        entity: "User",
        entityId: req.user.userId
      });
    }
    clearAuthCookies(res);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    const user = await User.findById(req.user.userId).populate("schoolId");
    if (!user) {
      throw AppError.notFound("User not found");
    }
    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    const data = ChangePasswordSchema.parse(req.body);
    const user = await User.findById(req.user.userId).select("+passwordHash");
    if (!user) {
      throw AppError.notFound("User not found");
    }
    const isValid = await comparePassword(data.currentPassword, user.passwordHash);
    if (!isValid) {
      throw AppError.badRequest("Current password is incorrect");
    }
    user.passwordHash = await hashPassword(data.newPassword);
    await user.save();
    await createAuditLog({
      userId: user._id.toString(),
      action: "CHANGE_PASSWORD",
      entity: "User",
      entityId: user._id.toString()
    });
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
}
