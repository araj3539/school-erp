import { Request, Response, NextFunction } from "express";
import { Student, Payment } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { UserRole } from "@school-erp/shared";

export async function enforcePaymentListOwnership(req: Request, _res: Response, next: NextFunction) {
  try {
    if (req.user!.role === UserRole.STUDENT) {
      const student = await Student.findOne({ schoolId: req.user!.schoolId, userId: req.user!.userId }).select("_id").lean();
      if (!student) throw AppError.notFound("Student not found");
      if (req.query.studentId && String(req.query.studentId) !== student._id.toString()) {
        throw AppError.forbidden("Students can only access their own payments");
      }
      req.query.studentId = student._id.toString();
    } else if (req.user!.role === UserRole.PARENT) {
      const studentId = String(req.query.studentId || "").trim();
      if (!studentId) throw AppError.badRequest("studentId is required for parent payment access");
      const linked = await Student.exists({ _id: studentId, schoolId: req.user!.schoolId, parentIds: req.user!.userId });
      if (!linked) throw AppError.forbidden("Parents can only access payments for linked children");
    }
    next();
  } catch (error) {
    next(error);
  }
}

export async function enforcePaymentOwnership(req: Request, _res: Response, next: NextFunction) {
  try {
    if (req.user!.role === UserRole.STUDENT || req.user!.role === UserRole.PARENT) {
      const payment = await Payment.findOne({ _id: req.validatedParams?.id, schoolId: req.user!.schoolId }).select("studentId").lean();
      if (!payment) throw AppError.notFound("Payment not found");
      const student = await Student.findOne({ _id: payment.studentId, schoolId: req.user!.schoolId }).select("userId parentIds").lean();
      if (!student) throw AppError.notFound("Student not found");
      if (req.user!.role === UserRole.STUDENT && student.userId?.toString() !== req.user!.userId) {
        throw AppError.forbidden("Students can only access their own payment");
      }
      if (req.user!.role === UserRole.PARENT && !student.parentIds.some((parentId) => parentId.toString() === req.user!.userId)) {
        throw AppError.forbidden("Parents can only access payments for linked children");
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}
