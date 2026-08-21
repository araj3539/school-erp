import { Router } from "express";
import { authenticate, requirePermission, requireAnyPermission, validate } from "../middleware/index.js";
import { getAttendance, markAttendance, getStudentAttendance, getMonthlyAttendanceReport } from "../controllers/attendanceController.js";
import { MarkAttendanceSchema, PaginationSchema, DateRangeSchema, IdParamSchema } from "../validators/index.js";

const router = Router();

router.use(authenticate);
router.get("/", requirePermission("attendance:read"), validate(PaginationSchema, "query"), getAttendance);
router.post("/", requirePermission("attendance:write"), validate(MarkAttendanceSchema), markAttendance);
router.get("/student/:id", requireAnyPermission("attendance:read", "attendance:read:own"), validate(IdParamSchema, "params"), validate(DateRangeSchema, "query"), getStudentAttendance);
router.get("/report/monthly", requirePermission("attendance:read"), getMonthlyAttendanceReport);

export default router;
