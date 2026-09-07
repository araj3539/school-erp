import { Request, Response, NextFunction } from "express";
import { ROLE_PERMISSIONS, StaffStatus, generateEmployeeId } from "@school-erp/shared";
import { Staff } from "../models/Staff.js";
import { CreateStaffSchema, UpdateStaffSchema } from "../validators/index.js";
import { createAuditLog } from "../services/auditLog.js";
import { AppError } from "../utils/errors.js";
import { getTenantId, withTenant } from "../utils/tenant.js";
import { escapeRegex } from "../utils/strings.js";

function canReadSalary(req: Request): boolean {
  const permissions = ROLE_PERMISSIONS[req.user!.role as keyof typeof ROLE_PERMISSIONS] || [];
  return permissions.includes("*") || permissions.includes("salary:read");
}

function sanitizeStaff(staff: Record<string, unknown>, includeSalary: boolean) {
  if (includeSalary) return staff;
  const { salary: _salary, ...safe } = staff;
  return safe;
}

export async function getStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const query = req.validatedQuery as any;
    const { page = 1, limit = 20, status, department, search } = query;
    const dbQuery: Record<string, unknown> = { schoolId };
    if (status) dbQuery.status = status;
    if (department) dbQuery.department = department;
    if (search) {
      const escaped = escapeRegex(String(search));
      dbQuery.$or = [
        { firstName: { $regex: escaped, $options: "i" } },
        { lastName: { $regex: escaped, $options: "i" } },
        { employeeId: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } }
      ];
    }
    const skip = (page - 1) * limit;
    const [staff, total] = await Promise.all([
      Staff.find(dbQuery).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Staff.countDocuments(dbQuery)
    ]);
    res.json({
      data: staff.map((item) => sanitizeStaff(item as unknown as Record<string, unknown>, canReadSalary(req))),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
}

export async function getStaffById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const staff = await Staff.findOne({ _id: id, schoolId: getTenantId(req) }).lean();
    if (!staff) throw AppError.notFound("Staff member not found");
    res.json({ staff: sanitizeStaff(staff as unknown as Record<string, unknown>, canReadSalary(req)) });
  } catch (error) {
    next(error);
  }
}

export async function createStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const data = withTenant(req, CreateStaffSchema.parse(req.body) as any);
    if (!data.employeeId) data.employeeId = generateEmployeeId();

    const duplicate = await Staff.findOne({ schoolId: data.schoolId, employeeId: data.employeeId });
    if (duplicate) throw AppError.conflict("Employee ID already exists");
    const duplicateEmail = await Staff.findOne({ schoolId: data.schoolId, email: data.email });
    if (duplicateEmail) throw AppError.conflict("Email already registered");

    const staff = await Staff.create(data);
    await createAuditLog({
      userId: req.user!.userId,
      action: "CREATE",
      entity: "Staff",
      entityId: staff._id.toString(),
      after: { employeeId: staff.employeeId, name: `${staff.firstName} ${staff.lastName}`, department: staff.department }
    });
    res.status(201).json({ staff: sanitizeStaff(staff.toObject() as unknown as Record<string, unknown>, canReadSalary(req)) });
  } catch (error) {
    next(error);
  }
}

export async function updateStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const data = UpdateStaffSchema.parse(req.body) as any;
    const { schoolId: _ignored, ...safeData } = data;
    const staff = await Staff.findOneAndUpdate({ _id: id, schoolId: getTenantId(req) }, safeData, { new: true, runValidators: true }).lean();
    if (!staff) throw AppError.notFound("Staff member not found");
    await createAuditLog({ userId: req.user!.userId, action: "UPDATE", entity: "Staff", entityId: id, after: safeData });
    res.json({ staff: sanitizeStaff(staff as unknown as Record<string, unknown>, canReadSalary(req)) });
  } catch (error) {
    next(error);
  }
}

export async function deactivateStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const staff = await Staff.findOneAndUpdate(
      { _id: id, schoolId: getTenantId(req) },
      { status: StaffStatus.INACTIVE },
      { new: true }
    ).lean();
    if (!staff) throw AppError.notFound("Staff member not found");
    await createAuditLog({ userId: req.user!.userId, action: "DELETE", entity: "Staff", entityId: id, after: { status: StaffStatus.INACTIVE } });
    res.json({ message: "Staff member deactivated" });
  } catch (error) {
    next(error);
  }
}
