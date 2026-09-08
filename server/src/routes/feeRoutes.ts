import { Router } from "express";
import { authenticate, enforcePaymentListOwnership, enforcePaymentOwnership, requireAnyPermission, requirePermission, validate } from "../middleware/index.js";
import { requireStudentFeeOwnership } from "../middleware/feeOwnership.js";
import { getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure, getFees, getStudentFees, generateFees, getDailyCollectionReport, getMonthlyCollectionReport } from "../controllers/feeController.js";
import { collectPayment, reversePayment, getPayments, getReceiptPDF } from "../controllers/paymentController.js";
import { createPaymentOrder } from "../controllers/paymentOrderController.js";
import { getFinancialReconciliation } from "../controllers/reconciliationController.js";
import { CreateFeeStructureSchema, CreatePaymentSchema, PaymentReversalSchema, PaginationSchema, DateRangeSchema, IdParamSchema, FeeStructureQuerySchema, StudentFeeQuerySchema, GenerateFeesSchema, DailyCollectionReportQuerySchema, MonthlyCollectionReportQuerySchema } from "../validators/index.js";
import { CreatePaymentOrderSchema } from "../validators/paymentOrderValidators.js";

const router = Router();

router.use(authenticate);
router.get("/structures", requirePermission("fees:read"), validate(FeeStructureQuerySchema, "query"), getFeeStructures);
router.post("/structures", requirePermission("fees:write"), validate(CreateFeeStructureSchema), createFeeStructure);
router.put("/structures/:id", requirePermission("fees:write"), validate(IdParamSchema, "params"), validate(CreateFeeStructureSchema), updateFeeStructure);
router.delete("/structures/:id", requirePermission("fees:delete"), validate(IdParamSchema, "params"), deleteFeeStructure);
router.get("/", requirePermission("fees:read"), validate(PaginationSchema, "query"), getFees);
router.get("/student/:id", requireAnyPermission("fees:read", "fees:read:own", "fees:read:child"), validate(IdParamSchema, "params"), validate(StudentFeeQuerySchema, "query"), requireStudentFeeOwnership, getStudentFees);
router.post("/generate", requirePermission("fees:write"), validate(GenerateFeesSchema), generateFees);
router.post("/payments/orders", requireAnyPermission("payments:write", "payments:online:create"), validate(CreatePaymentOrderSchema), createPaymentOrder);
router.post("/payments", requirePermission("payments:write"), validate(CreatePaymentSchema), collectPayment);
router.get("/payments", requireAnyPermission("payments:read", "payments:read:own", "payments:read:child"), enforcePaymentListOwnership, validate(PaginationSchema, "query"), getPayments);
router.post("/payments/:id/reverse", requirePermission("payments:reverse"), validate(IdParamSchema, "params"), validate(PaymentReversalSchema), reversePayment);
router.get("/reports/daily", requirePermission("reports:read"), validate(DailyCollectionReportQuerySchema, "query"), getDailyCollectionReport);
router.get("/reports/monthly", requirePermission("reports:read"), validate(MonthlyCollectionReportQuerySchema, "query"), getMonthlyCollectionReport);
router.get("/reports/reconciliation", requirePermission("reports:read"), validate(DateRangeSchema, "query"), getFinancialReconciliation);
router.get("/receipt/:id", requireAnyPermission("payments:read", "payments:read:own", "payments:read:child"), validate(IdParamSchema, "params"), enforcePaymentOwnership, getReceiptPDF);

export default router;
