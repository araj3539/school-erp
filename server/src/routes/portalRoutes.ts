import { Router } from "express";
import { authenticate, requirePermission, validate } from "../middleware/index.js";
import { getPortalDashboard } from "../controllers/portalController.js";
import { getTeacherWorkspace } from "../controllers/teacherPortalController.js";
import { getTeacherHomework, getTeacherHomeworkOptions } from "../controllers/teacherHomeworkController.js";
import { createHomework } from "../controllers/homeworkController.js";
import { CreateHomeworkSchema } from "../validators/index.js";
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
router.get("/teacher/workspace", (req, res, next) => {
  getTeacherWorkspace(req, res, next);
});
router.get("/teacher/homework/options", requirePermission("homework:write"), (req, res, next) => {
  getTeacherHomeworkOptions(req, res, next);
});
router.get("/teacher/homework", requirePermission("homework:read"), (req, res, next) => {
  getTeacherHomework(req, res, next);
});
router.post("/teacher/homework", requirePermission("homework:write"), validate(CreateHomeworkSchema), (req, res, next) => {
  createHomework(req, res, next);
});
export default router;
