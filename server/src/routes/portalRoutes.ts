import { Router } from "express";
import { authenticate } from "../middleware/index.js";
import { getPortalDashboard } from "../controllers/portalController.js";
import { UserRole } from "@school-erp/shared";

const router = Router();
router.use(authenticate);
router.get("/dashboard", (req, res, next) => {
  if (![UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT].includes(req.user!.role)) {
    res.status(403).json({ error: "Portal dashboard is not available for this role" });
    return;
  }
  getPortalDashboard(req, res, next);
});
export default router;
