import { Request, Response, NextFunction } from "express";
import { ResultTemplate } from "../models/ResultTemplate.js";
import { createAuditLog } from "../services/auditLog.js";
import { getTenantId } from "../utils/tenant.js";
import { AppError } from "../utils/errors.js";

export async function listResultTemplates(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const q = req.validatedQuery as any;
    const { page = 1, limit = 20, sortBy, sortOrder, type, isActive, isDefault, search } = q;
    const filter: Record<string, unknown> = { schoolId };
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (isDefault !== undefined) filter.isDefault = isDefault === "true";
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {};
    if (sortBy) sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    else sort.name = 1;
    const [data, total] = await Promise.all([
      ResultTemplate.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      ResultTemplate.countDocuments(filter),
    ]);
    res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e) { next(e); }
}

export async function getResultTemplateById(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const { id } = req.validatedParams as { id: string };
    const template = await ResultTemplate.findOne({ _id: id, schoolId }).lean();
    if (!template) throw AppError.notFound("Result template not found");
    res.json({ template });
  } catch (e) { next(e); }
}

export async function createResultTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const data = req.validatedBody as any;
    const existing = await ResultTemplate.findOne({ schoolId, name: data.name }).lean();
    if (existing) throw AppError.conflict("A result template with this name already exists");
    const template = await ResultTemplate.create({ ...data, schoolId, createdBy: req.user!.userId });
    await createAuditLog({
      schoolId: String(schoolId),
      userId: req.user!.userId,
      action: "CREATE",
      entity: "ResultTemplate",
      entityId: template._id.toString(),
      after: { name: template.name, type: template.type, isDefault: template.isDefault },
    });
    res.status(201).json({ template });
  } catch (e) { next(e); }
}

export async function updateResultTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const { id } = req.validatedParams as { id: string };
    const data = req.validatedBody as any;
    const existing = await ResultTemplate.findOne({ _id: id, schoolId, isActive: true }).lean();
    if (!existing) throw AppError.notFound("Result template not found");
    if (data.name && data.name !== existing.name) {
      const duplicate = await ResultTemplate.findOne({ schoolId, name: data.name, _id: { $ne: id } }).lean();
      if (duplicate) throw AppError.conflict("A result template with this name already exists");
    }
    const template = await ResultTemplate.findOneAndUpdate(
      { _id: id, schoolId },
      { $set: { ...data, updatedBy: req.user!.userId } },
      { new: true, runValidators: true },
    ).lean();
    if (!template) throw AppError.notFound("Result template not found");
    await createAuditLog({
      schoolId: String(schoolId),
      userId: req.user!.userId,
      action: "UPDATE",
      entity: "ResultTemplate",
      entityId: id,
      before: { name: existing.name, type: existing.type, isDefault: existing.isDefault },
      after: { name: template.name, type: template.type, isDefault: template.isDefault },
    });
    res.json({ template });
  } catch (e) { next(e); }
}

export async function archiveResultTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const { id } = req.validatedParams as { id: string };
    const existing = await ResultTemplate.findOne({ _id: id, schoolId, isActive: true }).lean();
    if (!existing) throw AppError.notFound("Result template not found");
    if (existing.isDefault) throw AppError.badRequest("Cannot archive the default template; set another template as default first");
    const template = await ResultTemplate.findOneAndUpdate(
      { _id: id, schoolId },
      { $set: { isActive: false, updatedBy: req.user!.userId } },
      { new: true },
    ).lean();
    await createAuditLog({
      schoolId: String(schoolId),
      userId: req.user!.userId,
      action: "ARCHIVE",
      entity: "ResultTemplate",
      entityId: id,
      before: { name: existing.name, isActive: true },
      after: { name: template!.name, isActive: false },
    });
    res.json({ template });
  } catch (e) { next(e); }
}

export async function setDefaultResultTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const schoolId = getTenantId(req);
    const { id } = req.validatedParams as { id: string };
    const data = req.validatedBody as any;
    if (!data.isDefault) throw AppError.badRequest("isDefault must be true to set a template as default");
    const existing = await ResultTemplate.findOne({ _id: id, schoolId, isActive: true }).lean();
    if (!existing) throw AppError.notFound("Result template not found");
    // Unset any other default
    await ResultTemplate.updateMany({ schoolId, isDefault: true, _id: { $ne: id } }, { $set: { isDefault: false, updatedBy: req.user!.userId } });
    const template = await ResultTemplate.findOneAndUpdate(
      { _id: id, schoolId },
      { $set: { isDefault: true, updatedBy: req.user!.userId } },
      { new: true },
    ).lean();
    await createAuditLog({
      schoolId: String(schoolId),
      userId: req.user!.userId,
      action: "UPDATE",
      entity: "ResultTemplate",
      entityId: id,
      before: { name: existing.name, isDefault: false },
      after: { name: template!.name, isDefault: true },
    });
    res.json({ template });
  } catch (e) { next(e); }
}
