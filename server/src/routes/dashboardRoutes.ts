import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/index.js";
import { getDashboardStats, getDashboardCharts, getBirthdays } from "../controllers/dashboardController.js";

const router = Router();

router.use(authenticate);
router.get("/stats", requirePermission("reports:read"), getDashboardStats);
router.get("/charts", requirePermission("reports:read"), getDashboardCharts);
router.get("/birthdays", requirePermission("students:read"), getBirthdays);

export default router;
