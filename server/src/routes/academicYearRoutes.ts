import { Router } from "express";
import { authenticate, requirePermission, validate } from "../middleware/index.js";
import { createAcademicYear, getAcademicYears, setCurrentAcademicYear, updateAcademicYear } from "../controllers/academicYearController.js";
import { AcademicYearCreateSchema, AcademicYearUpdateSchema } from "../validators/academicYear.js";
import { IdParamSchema } from "../validators/index.js";

const router = Router();
router.use(authenticate);
router.get("/", requirePermission("settings:read"), getAcademicYears);
router.post("/", requirePermission("settings:write"), validate(AcademicYearCreateSchema), createAcademicYear);
router.patch("/:id", requirePermission("settings:write"), validate(IdParamSchema, "params"), validate(AcademicYearUpdateSchema), updateAcademicYear);
router.post("/:id/set-current", requirePermission("settings:write"), validate(IdParamSchema, "params"), setCurrentAcademicYear);
export default router;
