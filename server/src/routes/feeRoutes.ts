import { Router } from "express";
import { authenticate, requirePermission, validate } from "../middleware/index.js";
import { getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure, getFees, getStudentFees, generateFees, collectPayment, getPayments, getDailyCollectionReport, getMonthlyCollectionReport, getReceiptPDF } from "../controllers/feeController.js";
import { CreateFeeStructureSchema, CreatePaymentSchema, PaginationSchema, DateRangeSchema, IdParamSchema } from "../validators/index.js";

const router = Router();

router.use(authenticate);
router.get("/structures", requirePermission("fees:read"), getFeeStructures);
router.post("/structures", requirePermission("fees:write"), validate(CreateFeeStructureSchema), createFeeStructure);
router.put("/structures/:id", requirePermission("fees:write"), validate(IdParamSchema), validate(CreateFeeStructureSchema), updateFeeStructure);
router.delete("/structures/:id", requirePermission("fees:delete"), validate(IdParamSchema), deleteFeeStructure);
router.get("/", requirePermission("fees:read"), validate(PaginationSchema), getFees);
router.get("/student/:id", requirePermission("fees:read"), validate(IdParamSchema), getStudentFees);
router.post("/generate", requirePermission("fees:write"), generateFees);
router.post("/payments", requirePermission("fees:write"), validate(CreatePaymentSchema), collectPayment);
router.get("/payments", requirePermission("fees:read"), validate(PaginationSchema), getPayments);
router.get("/reports/daily", requirePermission("fees:read"), validate(DateRangeSchema), getDailyCollectionReport);
router.get("/reports/monthly", requirePermission("fees:read"), getMonthlyCollectionReport);
router.get("/receipt/:id", requirePermission("fees:read"), validate(IdParamSchema), getReceiptPDF);

export default router;
