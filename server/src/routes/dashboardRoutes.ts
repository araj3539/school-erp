import { Router } from "express";
import { authenticate } from "../middleware";
import { getDashboardStats, getDashboardCharts, getBirthdays } from "../controllers/dashboardController";

const router = Router();

router.use(authenticate);
router.get("/stats", getDashboardStats);
router.get("/charts", getDashboardCharts);
router.get("/birthdays", getBirthdays);

export default router;
