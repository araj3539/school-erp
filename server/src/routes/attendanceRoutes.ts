import { Router } from "express";
import { authenticate, requirePermission, requireAnyPermission, validate } from "../middleware/index.js";
import { getAttendance, markAttendance, bulkMarkAttendance, getStudentAttendance, getMonthlyAttendanceReport } from "../controllers/attendanceController.js";
import { MarkAttendanceSchema, BulkAttendanceSchema, AttendanceQuerySchema, AttendanceDateRangeSchema, IdParamSchema } from "../validators/index.js";

const router = Router();
router.use(authenticate);
router.get("/", requirePermission("attendance:read"), validate(AttendanceQuerySchema, "query"), getAttendance);
router.post("/", requirePermission("attendance:write"), validate(MarkAttendanceSchema), markAttendance);
router.post("/bulk", requirePermission("attendance:write"), validate(BulkAttendanceSchema), bulkMarkAttendance);
router.get("/student/:id", requireAnyPermission("attendance:read", "attendance:read:own", "attendance:read:child"), validate(IdParamSchema, "params"), validate(AttendanceDateRangeSchema, "query"), getStudentAttendance);
router.get("/report/monthly", requirePermission("attendance:read"), getMonthlyAttendanceReport);
export default router;
