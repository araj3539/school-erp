import { Router } from "express";
import { authenticate, requirePermission, validate } from "../middleware/index.js";
import { getAttendanceReport, getFeeReport, getStudentReport } from "../controllers/reportController.js";
import { ReportQuerySchema } from "../validators/index.js";

const router = Router();
router.use(authenticate, requirePermission("reports:read"));
router.get("/students", validate(ReportQuerySchema, "query"), getStudentReport);
router.get("/attendance", validate(ReportQuerySchema, "query"), getAttendanceReport);
router.get("/fees", validate(ReportQuerySchema, "query"), getFeeReport);

export default router;
