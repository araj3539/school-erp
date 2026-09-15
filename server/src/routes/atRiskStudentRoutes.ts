import { Router } from "express";
import { requirePermission } from "../middleware/rbac.js";
import { listAtRiskStudents } from "../controllers/atRiskStudentController.js";

const router = Router();
router.get("/", requirePermission("students:read"), listAtRiskStudents);
export default router;
