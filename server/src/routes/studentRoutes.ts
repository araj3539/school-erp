import { Router } from "express";
import { authenticate, requirePermission, validate } from "../middleware/index.js";
import { upload } from "../middleware/upload.js";
import { getStudents, getStudentById, createStudent, updateStudent, deleteStudent, uploadStudentDocument, bulkImportStudents, exportStudents } from "../controllers/studentController.js";
import { CreateStudentSchema, UpdateStudentSchema, PaginationSchema, IdParamSchema } from "../validators/index.js";
import { z } from "zod";

const router = Router();

router.use(authenticate);
router.get("/", requirePermission("students:read"), validate(PaginationSchema), getStudents);
router.get("/export", requirePermission("students:read"), exportStudents);
router.get("/:id", requirePermission("students:read"), validate(IdParamSchema), getStudentById);
router.post("/", requirePermission("students:write"), validate(CreateStudentSchema), createStudent);
router.put("/:id", requirePermission("students:write"), validate(IdParamSchema), validate(UpdateStudentSchema), updateStudent);
router.delete("/:id", requirePermission("students:delete"), validate(IdParamSchema), deleteStudent);
router.post("/bulk-import", requirePermission("students:write"), upload.single("file"), bulkImportStudents);
router.post("/:id/documents", requirePermission("students:write"), validate(IdParamSchema), upload.single("file"), uploadStudentDocument);

export default router;
