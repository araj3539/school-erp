import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { UserRole } from "@school-erp/shared";
import { Student, User } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { getTenantId } from "../utils/tenant.js";
import { createAuditLog } from "../services/auditLog.js";
import { ParentAssignmentSchema } from "../validators/parentAssignment.js";

export async function getStudentParents(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const schoolId = getTenantId(req);
    const student = await Student.findOne({ _id: id, schoolId }).select("_id parentIds").lean();
    if (!student) throw AppError.notFound("Student not found");

    const parents = await User.find({
      _id: { $in: student.parentIds },
      schoolId,
      role: UserRole.PARENT,
    }).select("_id email isActive profileId createdAt").lean();

    res.json({ data: parents });
  } catch (error) {
    next(error);
  }
}

export async function assignStudentParents(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const schoolId = getTenantId(req);
    const { parentIds } = ParentAssignmentSchema.parse(req.body);

    const student = await Student.findOne({ _id: id, schoolId });
    if (!student) throw AppError.notFound("Student not found");

    if (parentIds.length) {
      const parents = await User.find({
        _id: { $in: parentIds },
        schoolId,
        role: UserRole.PARENT,
        isActive: true,
      }).select("_id").lean();

      if (parents.length !== parentIds.length) {
        throw AppError.badRequest("Every assigned parent must be an active parent user in this school");
      }
    }

    const previousParentIds = student.parentIds.map((parentId: Types.ObjectId) => parentId.toString());
    student.parentIds = parentIds.map((parentId: string) => new Types.ObjectId(parentId));
    await student.save();

    await createAuditLog({
      userId: req.user!.userId,
      action: "ASSIGN_PARENTS",
      entity: "Student",
      entityId: student._id.toString(),
      before: { parentIds: previousParentIds },
      after: { parentIds },
    });

    const parents = await User.find({ _id: { $in: parentIds }, schoolId, role: UserRole.PARENT })
      .select("_id email isActive profileId createdAt")
      .lean();

    res.json({ studentId: student._id, data: parents });
  } catch (error) {
    next(error);
  }
}
