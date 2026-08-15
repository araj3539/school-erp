import { Router } from "express";
import { authenticate, requirePermission, validate } from "../middleware/index.js";
import { getClasses, getClassById, createClass, updateClass, deleteClass, getSections, createSection, updateSection, deleteSection, getSubjects, createSubject, updateSubject, deleteSubject } from "../controllers/classController.js";
import { CreateClassSchema, UpdateClassSchema, CreateSectionSchema, UpdateSectionSchema, CreateSubjectSchema, UpdateSubjectSchema, PaginationSchema, IdParamSchema } from "../validators/index.js";

const router = Router();

router.use(authenticate);
router.get("/classes", requirePermission("classes:read"), validate(PaginationSchema, "query"), getClasses);
router.get("/classes/:id", requirePermission("classes:read"), validate(IdParamSchema, "params"), getClassById);
router.post("/classes", requirePermission("classes:write"), validate(CreateClassSchema), createClass);
router.put("/classes/:id", requirePermission("classes:write"), validate(IdParamSchema, "params"), validate(UpdateClassSchema), updateClass);
router.delete("/classes/:id", requirePermission("classes:delete"), validate(IdParamSchema, "params"), deleteClass);
router.get("/sections", requirePermission("classes:read"), getSections);
router.post("/sections", requirePermission("classes:write"), validate(CreateSectionSchema), createSection);
router.put("/sections/:id", requirePermission("classes:write"), validate(IdParamSchema, "params"), validate(UpdateSectionSchema), updateSection);
router.delete("/sections/:id", requirePermission("classes:delete"), validate(IdParamSchema, "params"), deleteSection);
router.get("/subjects", requirePermission("classes:read"), getSubjects);
router.post("/subjects", requirePermission("classes:write"), validate(CreateSubjectSchema), createSubject);
router.put("/subjects/:id", requirePermission("classes:write"), validate(IdParamSchema, "params"), validate(UpdateSubjectSchema), updateSubject);
router.delete("/subjects/:id", requirePermission("classes:delete"), validate(IdParamSchema, "params"), deleteSubject);

export default router;
