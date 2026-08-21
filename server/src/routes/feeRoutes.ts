import { Router } from "express";
import { authenticate, requirePermission, validate } from "../middleware/index.js";
import { getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure, getFees, getStudentFees, generateFees, collectPayment, getPayments, getDailyCollectionReport, getMonthlyCollectionReport, getReceiptPDF } from "../controllers/feeController.js";
import { CreateFeeStructureSchema, CreatePaymentSchema, PaginationSchema, DateRangeSchema, IdParamSchema } from "../validators/index.js";

const router = Router();

router.use(authenticate);
router.get("/structures", requirePermission("fees:read"), getFeeStructures);
router.post("/structures", requirePermission("fees:write"), validate(CreateFeeStructureSchema), createFeeStructure);
router.put("/structures/:id", requirePermission("fees:write"), validate(IdParamSchema, "params"), validate(CreateFeeStructureSchema), updateFeeStructure);
router.delete("/structures/:id", requirePermission("fees:delete"), validate(IdParamSchema, "params"), deleteFeeStructure);
router.get("/", requirePermission("fees:read"), validate(PaginationSchema, "query"), getFees);
router.get("/student/:id", requirePermission("fees:read"), validate(IdParamSchema, "params"), getStudentFees);
router.post("/generate", requirePermission("fees:write"), generateFees);
router.post("/payments", requirePermission("payments:write"), validate(CreatePaymentSchema), collectPayment);
router.get("/payments", requirePermission("payments:read"), validate(PaginationSchema, "query"), getPayments);
router.get("/reports/daily", requirePermission("reports:read"), validate(DateRangeSchema, "query"), getDailyCollectionReport);
router.get("/reports/monthly", requirePermission("reports:read"), getMonthlyCollectionReport);
router.get("/receipt/:id", requirePermission("payments:read"), validate(IdParamSchema, "params"), getReceiptPDF);

export default router;
