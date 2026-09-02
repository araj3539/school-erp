import { Request, Response, NextFunction } from "express";
import { Student } from "../models/index.js";
import { getTenantId } from "../utils/tenant.js";
import { AppError } from "../utils/errors.js";
import { getR2SignedUrl } from "../services/r2.js";

function assertParent(req: Request): void {
  if (req.user?.role !== "parent") throw AppError.forbidden("Parent access required");
}

export async function getParentStudents(req: Request, res: Response, next: NextFunction) {
  try {
    assertParent(req);
    const { page = 1, limit = 20, sortBy, sortOrder } = req.validatedQuery as any;
    const schoolId = getTenantId(req);
    const query: any = { schoolId, parentIds: req.user!.userId };
    const sort: any = {};
    if (sortBy) sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    else sort.createdAt = -1;
    const skip = (page - 1) * limit;
    const [students, total] = await Promise.all([
      Student.find(query).select("-documents.url -documents.publicId").populate("classId sectionId").sort(sort).skip(skip).limit(limit).lean(),
      Student.countDocuments(query),
    ]);
    res.json({ data: students, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

export async function getParentStudentById(req: Request, res: Response, next: NextFunction) {
  try {
    assertParent(req);
    const { id } = req.validatedParams as { id: string };
    const student = await Student.findOne({
      _id: id,
      schoolId: getTenantId(req),
      parentIds: req.user!.userId,
    }).select("-documents.url -documents.publicId").populate("classId sectionId userId");
    if (!student) throw AppError.notFound("Student not found");
    res.json({ student });
  } catch (error) { next(error); }
}

export async function getParentStudentDocumentUrl(req: Request, res: Response, next: NextFunction) {
  try {
    assertParent(req);
    const { id, documentId } = req.validatedParams as { id: string; documentId: string };
    const student = await Student.findOne({
      _id: id,
      schoolId: getTenantId(req),
      parentIds: req.user!.userId,
    }).select("documents").lean();
    if (!student) throw AppError.notFound("Student not found");
    const document = (student.documents as any[]).find((item) => item._id?.toString() === documentId);
    if (!document?.url) throw AppError.notFound("Document not found");
    const url = await getR2SignedUrl(document.url, 600);
    res.json({ url, expiresIn: 600 });
  } catch (error) { next(error); }
}
