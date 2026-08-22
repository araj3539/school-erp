import { Router } from "express";
import { authenticate, requireAnyPermission, requirePermission, validate } from "../middleware/index.js";
import { upload } from "../middleware/upload.js";
import { getStudents, getStudentById, getStudentDocumentUrl, createStudent, updateStudent, deleteStudent, uploadStudentDocument, deleteStudentDocument, bulkImportStudents, exportStudents } from "../controllers/studentController.js";
import { getStudentParents, assignStudentParents } from "../controllers/studentParentController.js";
import { getStudentDocumentRecoveryHistory, previewStudentDocumentRecovery, restoreStudentDocumentRecovery, runManualStorageBackup } from "../controllers/documentRecoveryController.js";
import { getParentStudents, getParentStudentById, getParentStudentDocumentUrl } from "../controllers/parentStudentAccessController.js";
import { UserRole } from "@school-erp/shared";
import { CreateStudentSchema, UpdateStudentSchema, PaginationSchema, IdParamSchema, StudentDocumentParamSchema } from "../validators/index.js";
const router = Router();
router.use(authenticate);

router.get("/", (req, res, next) => req.user?.role === UserRole.PARENT ? getParentStudents(req, res, next) : next(), requirePermission("students:read:child"), validate(PaginationSchema, "query"));
router.get("/", requireAnyPermission("students:read", "students:read:own"), validate(PaginationSchema, "query"), getStudents);
router.get("/export", requirePermission("students:read"), exportStudents);
router.post("/document-recoveries/backup", requirePermission("settings:write"), runManualStorageBackup);
router.get("/:id/parents", requirePermission("students:read"), validate(IdParamSchema, "params"), getStudentParents);
router.put("/:id/parents", requirePermission("students:write"), validate(IdParamSchema, "params"), assignStudentParents);

router.get("/:id/documents/:documentId/url", (req, res, next) => req.user?.role === UserRole.PARENT ? getParentStudentDocumentUrl(req, res, next) : next(), requirePermission("students:read:child"), validate(StudentDocumentParamSchema, "params"));
router.get("/:id/documents/:documentId/url", requireAnyPermission("students:read", "students:read:own"), validate(StudentDocumentParamSchema, "params"), getStudentDocumentUrl);

router.get("/:id/document-recoveries", requirePermission("students:read:child"), validate(IdParamSchema, "params"), (req, res, next) => req.user?.role === UserRole.PARENT ? getStudentDocumentRecoveryHistory(req, res, next) : next());
router.get("/:id/document-recoveries", requireAnyPermission("students:read", "students:read:own"), validate(IdParamSchema, "params"), getStudentDocumentRecoveryHistory);
router.get("/:id/document-recoveries/:recoveryId/preview", requirePermission("students:read:child"), (req, res, next) => req.user?.role === UserRole.PARENT ? previewStudentDocumentRecovery(req, res, next) : next());
router.get("/:id/document-recoveries/:recoveryId/preview", requireAnyPermission("students:read", "students:read:own"), previewStudentDocumentRecovery);
router.post("/:id/document-recoveries/:recoveryId/restore", requirePermission("students:write"), restoreStudentDocumentRecovery);

router.get("/:id", requirePermission("students:read:child"), validate(IdParamSchema, "params"), (req, res, next) => req.user?.role === UserRole.PARENT ? getParentStudentById(req, res, next) : next());
router.get("/:id", requireAnyPermission("students:read", "students:read:own"), validate(IdParamSchema, "params"), getStudentById);
router.post("/", requirePermission("students:write"), validate(CreateStudentSchema), createStudent);
router.put("/:id", requirePermission("students:write"), validate(IdParamSchema, "params"), validate(UpdateStudentSchema), updateStudent);
router.delete("/:id", requirePermission("students:delete"), validate(IdParamSchema, "params"), deleteStudent);
router.post("/bulk-import", requirePermission("students:write"), upload.single("file"), bulkImportStudents);
router.post("/:id/documents", requirePermission("students:write"), validate(IdParamSchema, "params"), upload.single("file"), uploadStudentDocument);
router.delete("/:id/documents/:documentId", requirePermission("students:write"), validate(StudentDocumentParamSchema, "params"), deleteStudentDocument);
export default router;
