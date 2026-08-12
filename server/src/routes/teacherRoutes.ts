import { Router } from "express";
import { authenticate, requirePermission, validate } from "../middleware/index.js";
import { getTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher } from "../controllers/teacherController.js";
import { CreateTeacherSchema, UpdateTeacherSchema, PaginationSchema, IdParamSchema } from "../validators/index.js";

const router = Router();

router.use(authenticate);
router.get("/", requirePermission("teachers:read"), validate(PaginationSchema), getTeachers);
router.get("/:id", requirePermission("teachers:read"), validate(IdParamSchema), getTeacherById);
router.post("/", requirePermission("teachers:write"), validate(CreateTeacherSchema), createTeacher);
router.put("/:id", requirePermission("teachers:write"), validate(IdParamSchema), validate(UpdateTeacherSchema), updateTeacher);
router.delete("/:id", requirePermission("teachers:delete"), validate(IdParamSchema), deleteTeacher);

export default router;
