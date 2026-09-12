import { Router } from "express";
import { authenticate, requirePermission, validate } from "../middleware/index.js";
import { previewAcademicYearTransition, executeAcademicYearTransition } from "../controllers/academicYearTransitionController.js";
import { AcademicYearTransitionPreviewSchema, AcademicYearTransitionExecuteSchema } from "../validators/academicYearTransition.js";
const router = Router();
router.use(authenticate);
router.post("/preview", requirePermission("settings:read"), validate(AcademicYearTransitionPreviewSchema), previewAcademicYearTransition);
router.post("/execute", requirePermission("settings:write"), validate(AcademicYearTransitionExecuteSchema), executeAcademicYearTransition);
export default router;
