import { Router } from "express";
import { authenticate, requirePermission, validate } from "../middleware";
import { getAttendance, markAttendance, getStudentAttendance, getMonthlyAttendanceReport } from "../controllers/attendanceController";
import { MarkAttendanceSchema, PaginationSchema, DateRangeSchema, IdParamSchema } from "../validators";

const router = Router();

router.use(authenticate);
router.get("/", requirePermission("attendance:read"), validate(PaginationSchema), getAttendance);
router.post("/", requirePermission("attendance:write"), validate(MarkAttendanceSchema), markAttendance);
router.get("/student/:id", requirePermission("attendance:read"), validate(IdParamSchema), validate(DateRangeSchema), getStudentAttendance);
router.get("/report/monthly", requirePermission("attendance:read"), getMonthlyAttendanceReport);

export default router;
