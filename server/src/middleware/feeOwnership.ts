import { Request, Response, NextFunction } from "express";
import { Student } from "../models/index.js";
import { UserRole } from "@school-erp/shared";

export async function requireStudentFeeOwnership(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (req.user.role !== UserRole.STUDENT && req.user.role !== UserRole.PARENT) {
      next();
      return;
    }

    const studentId = String(req.params.id || "");
    const student = await Student.findOne({ _id: studentId, schoolId: req.user.schoolId })
      .select("userId parentIds")
      .lean();

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    if (req.user.role === UserRole.STUDENT && student.userId?.toString() !== req.user.userId) {
      res.status(403).json({ error: "Students can only access their own fees" });
      return;
    }

    if (req.user.role === UserRole.PARENT && !student.parentIds.some((id) => id.toString() === req.user!.userId)) {
      res.status(403).json({ error: "Parents can only access fees for linked children" });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
