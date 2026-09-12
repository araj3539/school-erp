import { Router } from "express";
import { requirePermission, validate } from "../middleware/index.js";
import { authenticate } from "../middleware/auth.js";
import { StudentPromotionSchema, StudentPromotionExecuteSchema } from "../validators/studentPromotion.js";
import { previewStudentPromotion, executeStudentPromotion } from "../controllers/studentPromotionController.js";

const router = Router();
router.use(authenticate);
router.post("/preview", requirePermission("students:read"), validate(StudentPromotionSchema), previewStudentPromotion);
router.post("/execute", requirePermission("students:write"), validate(StudentPromotionExecuteSchema), executeStudentPromotion);
export default router;
