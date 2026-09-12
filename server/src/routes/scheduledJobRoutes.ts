import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/index.js";
import { listScheduledJobs } from "../controllers/scheduledJobController.js";
const router = Router();
router.use(authenticate, requirePermission("audit:read"));
router.get("/", listScheduledJobs);
export default router;
