import { Router } from "express";
import { authenticate, requirePermission, validate } from "../middleware/index.js";
import { IdParamSchema } from "../validators/index.js";
import { SectionGovernanceSchema, SectionAssignmentSchema } from "../validators/classGovernance.js";
import { getSectionGovernance, assignStudentsToSection } from "../controllers/classGovernanceController.js";
const router=Router(); router.use(authenticate);
router.post("/section",requirePermission("students:read"),validate(SectionGovernanceSchema),getSectionGovernance);
router.post("/section/assign",requirePermission("students:write"),validate(SectionAssignmentSchema),assignStudentsToSection);
export default router;
