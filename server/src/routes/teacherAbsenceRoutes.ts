import { Router } from "express";
import { authenticate, requirePermission, validate } from "../middleware/index.js";
import { createTeacherAbsence, assignTeacherSubstitute, getEligibleSubstitutes, getTeacherAbsence, getTeacherAbsences } from "../controllers/teacherAbsenceController.js";
import { CreateTeacherAbsenceSchema, SubstituteAssignmentSchema, TeacherAbsenceQuerySchema } from "../validators/teacherAbsence.js";
import { IdParamSchema } from "../validators/index.js";

const router = Router();
router.use(authenticate, requirePermission("teachers:write"));
router.get("/", validate(TeacherAbsenceQuerySchema, "query"), getTeacherAbsences);
router.post("/", validate(CreateTeacherAbsenceSchema), createTeacherAbsence);
router.get("/:id", validate(IdParamSchema, "params"), getTeacherAbsence);
router.get("/:id/eligible-substitutes", validate(IdParamSchema, "params"), getEligibleSubstitutes);
router.post("/:id/assign", validate(IdParamSchema, "params"), validate(SubstituteAssignmentSchema), assignTeacherSubstitute);
export default router;
