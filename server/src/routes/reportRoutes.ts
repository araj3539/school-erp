import { Router } from "express";
import { authenticate, requirePermission, validate } from "../middleware/index.js";
import { getAttendanceReport, getFeeDefaulterReport, getFeeLedgerReport, getFeeReport, getReconciliationExceptionReport, getStudentReport } from "../controllers/reportController.js";
import { exportManagementReport } from "../controllers/reportExportController.js";
import { FeeDefaulterQuerySchema, FeeLedgerReportQuerySchema, ReconciliationExceptionQuerySchema, ReportQuerySchema } from "../validators/index.js";

const router = Router();
router.use(authenticate, requirePermission("reports:read"));
router.get("/students", validate(ReportQuerySchema, "query"), getStudentReport);
router.get("/attendance", validate(ReportQuerySchema, "query"), getAttendanceReport);
router.get("/fees", validate(ReportQuerySchema, "query"), getFeeReport);
router.get("/fee-defaulters", validate(FeeDefaulterQuerySchema, "query"), getFeeDefaulterReport);
router.get("/fee-ledger", validate(FeeLedgerReportQuerySchema, "query"), getFeeLedgerReport);
router.get("/reconciliation-exceptions", validate(ReconciliationExceptionQuerySchema, "query"), getReconciliationExceptionReport);
router.get("/export", exportManagementReport);

export default router;
