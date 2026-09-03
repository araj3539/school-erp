import { Router } from "express";
import { authenticate, requirePermission, validate } from "../middleware/index.js";
import { getPortalDashboard } from "../controllers/portalController.js";
import { getStudentWorkspace } from "../controllers/studentPortalController.js";
import { getTeacherWorkspace } from "../controllers/teacherPortalController.js";
import { getTeacherHomework, getTeacherHomeworkOptions } from "../controllers/teacherHomeworkController.js";
import { getParentWorkspace } from "../controllers/parentPortalController.js";
import { createHomework } from "../controllers/homeworkController.js";
import { CreateHomeworkSchema } from "../validators/index.js";
import { UserRole } from "@school-erp/shared";

const router = Router();
router.use(authenticate);
router.get("/dashboard", (req, res, next) => {
  if (![UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT].includes(req.user!.role)) return res.status(403).json({ error: "Portal dashboard is not available for this role" });
  return getPortalDashboard(req, res, next);
});
router.get("/student/workspace", requirePermission("students:read:own"), requirePermission("attendance:read:own"), requirePermission("homework:read:own"), requirePermission("fees:read:own"), requirePermission("results:read:own"), requirePermission("timetable:read:own"), requirePermission("notices:read"), (req, res, next) => req.user!.role !== UserRole.STUDENT ? res.status(403).json({ error: "Student workspace is not available for this role" }) : getStudentWorkspace(req, res, next));
router.get("/teacher/workspace", (req, res, next) => getTeacherWorkspace(req, res, next));
router.get("/teacher/homework/options", requirePermission("homework:write"), (req, res, next) => getTeacherHomeworkOptions(req, res, next));
router.get("/teacher/homework", requirePermission("homework:read"), (req, res, next) => getTeacherHomework(req, res, next));
router.post("/teacher/homework", requirePermission("homework:write"), validate(CreateHomeworkSchema), (req, res, next) => createHomework(req, res, next));
router.get("/parent/workspace", requirePermission("students:read:child"), requirePermission("attendance:read:child"), requirePermission("homework:read:child"), requirePermission("fees:read:child"), requirePermission("results:read:child"), requirePermission("timetable:read:child"), requirePermission("notices:read"), (req, res, next) => req.user!.role !== UserRole.PARENT ? res.status(403).json({ error: "Parent workspace is not available for this role" }) : getParentWorkspace(req, res, next));
export default router;
