import { Request, Response, NextFunction } from "express";
import { User } from "../models/index.js";
import { CreateUserSchema, UpdateTenantUserSchema } from "../validators/index.js";
import { createAuditLog } from "../services/auditLog.js";
import { AppError } from "../utils/errors.js";
import { hashPassword } from "../services/auth.js";

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.validatedQuery as any;
    const { page = 1, limit = 20, sortBy, sortOrder, ...filters } = query;
    const dbQuery: any = { schoolId: req.user!.schoolId };
    if (filters.role) dbQuery.role = filters.role;
    if (filters.isActive !== undefined) dbQuery.isActive = filters.isActive === "true";
    const sort: any = {};
    if (sortBy) sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    else sort.createdAt = -1;
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(dbQuery).sort(sort).skip(skip).limit(limit).lean(),
      User.countDocuments(dbQuery)
    ]);
    res.json({ data: users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const user = await User.findOne({ _id: id, schoolId: req.user!.schoolId }).lean();
    if (!user) throw AppError.notFound("User not found");
    res.json({ user });
  } catch (error) { next(error); }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = req.user!.schoolId;
    const data = CreateUserSchema.parse({ ...req.body, schoolId });
    const existingUser = await User.findOne({ email: data.email, schoolId });
    if (existingUser) throw AppError.conflict("Email already registered");
    const passwordHash = await hashPassword(data.password);
    const user = await User.create({ ...data, passwordHash });
    await createAuditLog({ userId: req.user!.userId, schoolId, action: "CREATE", entity: "User", entityId: user._id.toString(), after: { email: user.email, role: user.role } });
    res.status(201).json({ user });
  } catch (error) { next(error); }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const schoolId = req.user!.schoolId;
    const data = UpdateTenantUserSchema.parse(req.body);
    const before = await User.findOne({ _id: id, schoolId }).lean();
    if (!before) throw AppError.notFound("User not found");
    if (data.email && data.email !== before.email) {
      const duplicate = await User.findOne({ _id: { $ne: id }, schoolId, email: data.email }).select("_id").lean();
      if (duplicate) throw AppError.conflict("Email already registered");
    }
    const user = await User.findOneAndUpdate({ _id: id, schoolId }, data, { new: true, runValidators: true }).lean();
    if (!user) throw AppError.notFound("User not found");
    await createAuditLog({ userId: req.user!.userId, schoolId, action: "UPDATE", entity: "User", entityId: id, before: { email: before.email, role: before.role, isActive: before.isActive }, after: { email: user.email, role: user.role, isActive: user.isActive } });
    res.json({ user });
  } catch (error) { next(error); }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const schoolId = req.user!.schoolId;
    const user = await User.findOneAndUpdate({ _id: id, schoolId }, { isActive: false }, { new: true }).lean();
    if (!user) throw AppError.notFound("User not found");
    await createAuditLog({ userId: req.user!.userId, schoolId, action: "DELETE", entity: "User", entityId: id, before: { isActive: true }, after: { isActive: false } });
    res.json({ message: "User deactivated successfully" });
  } catch (error) { next(error); }
}