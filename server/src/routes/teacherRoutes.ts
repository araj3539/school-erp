import { Router } from "express";
import { authenticate, requirePermission, validate } from "../middleware/index.js";
import { getTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher } from "../controllers/teacherController.js";
import { CreateTeacherSchema, UpdateTeacherSchema, TeacherQuerySchema, IdParamSchema } from "../validators/index.js";

const router = Router();

router.use(authenticate);
router.get("/", requirePermission("teachers:read"), validate(TeacherQuerySchema, "query"), getTeachers);
router.get("/:id", requirePermission("teachers:read"), validate(IdParamSchema, "params"), getTeacherById);
router.post("/", requirePermission("teachers:write"), validate(CreateTeacherSchema), createTeacher);
router.put("/:id", requirePermission("teachers:write"), validate(IdParamSchema, "params"), validate(UpdateTeacherSchema), updateTeacher);
router.delete("/:id", requirePermission("teachers:delete"), validate(IdParamSchema, "params"), deleteTeacher);

export default router;
