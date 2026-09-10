import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/index.js";
import { getAnalyticsOverview, getAnalyticsAiInsights, getAnalyticsAiStatus } from "../controllers/analyticsController.js";

const router = Router();
router.use(authenticate, requirePermission("reports:read"));
router.get("/overview", getAnalyticsOverview);
router.get("/ai/status", getAnalyticsAiStatus);
router.get("/ai/insights", getAnalyticsAiInsights);

export default router;
