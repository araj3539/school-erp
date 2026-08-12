import { Router } from "express";
import { authenticate, requirePermission, validate } from "../middleware";
import { getClasses, getClassById, createClass, updateClass, deleteClass, getSections, createSection, updateSection, deleteSection, getSubjects, createSubject, updateSubject, deleteSubject } from "../controllers/classController";
import { CreateClassSchema, UpdateClassSchema, CreateSectionSchema, UpdateSectionSchema, CreateSubjectSchema, UpdateSubjectSchema, PaginationSchema, IdParamSchema } from "../validators";

const router = Router();

router.use(authenticate);
router.get("/classes", requirePermission("classes:read"), validate(PaginationSchema), getClasses);
router.get("/classes/:id", requirePermission("classes:read"), validate(IdParamSchema), getClassById);
router.post("/classes", requirePermission("classes:write"), validate(CreateClassSchema), createClass);
router.put("/classes/:id", requirePermission("classes:write"), validate(IdParamSchema), validate(UpdateClassSchema), updateClass);
router.delete("/classes/:id", requirePermission("classes:delete"), validate(IdParamSchema), deleteClass);
router.get("/sections", requirePermission("classes:read"), getSections);
router.post("/sections", requirePermission("classes:write"), validate(CreateSectionSchema), createSection);
router.put("/sections/:id", requirePermission("classes:write"), validate(IdParamSchema), validate(UpdateSectionSchema), updateSection);
router.delete("/sections/:id", requirePermission("classes:delete"), validate(IdParamSchema), deleteSection);
router.get("/subjects", requirePermission("classes:read"), getSubjects);
router.post("/subjects", requirePermission("classes:write"), validate(CreateSubjectSchema), createSubject);
router.put("/subjects/:id", requirePermission("classes:write"), validate(IdParamSchema), validate(UpdateSubjectSchema), updateSubject);
router.delete("/subjects/:id", requirePermission("classes:delete"), validate(IdParamSchema), deleteSubject);

export default router;
