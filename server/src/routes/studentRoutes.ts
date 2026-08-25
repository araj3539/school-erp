import { Router } from "express";
import { authenticate, requireAnyPermission, requirePermission, validate } from "../middleware/index.js";
import { upload, validateStudentDocumentUpload } from "../middleware/upload.js";
import { getStudents, getStudentById, getStudentDocumentUrl, createStudent, updateStudent, deleteStudent, uploadStudentDocument, deleteStudentDocument, bulkImportStudents, exportStudents } from "../controllers/studentController.js";
import { getStudentParents, assignStudentParents } from "../controllers/studentParentController.js";
import { getStudentDocumentRecoveryHistory, previewStudentDocumentRecovery, restoreStudentDocumentRecovery, runManualStorageBackup } from "../controllers/documentRecoveryController.js";
import { getParentStudents, getParentStudentById, getParentStudentDocumentUrl } from "../controllers/parentStudentAccessController.js";
import { UserRole } from "@school-erp/shared";
import { CreateStudentSchema, UpdateStudentSchema, PaginationSchema, IdParamSchema, StudentDocumentParamSchema } from "../validators/index.js";
const router = Router();
router.use(authenticate);
const parentOnly = (req: any, _res: any, next: any) => req.user?.role === UserRole.PARENT ? next() : next("route");

router.get("/", parentOnly, requirePermission("students:read:child"), validate(PaginationSchema, "query"), getParentStudents);
router.get("/", requireAnyPermission("students:read", "students:read:own"), validate(PaginationSchema, "query"), getStudents);
router.get("/export", requirePermission("students:read"), exportStudents);
router.post("/document-recoveries/backup", requirePermission("settings:write"), runManualStorageBackup);
router.get("/:id/parents", requirePermission("students:read"), validate(IdParamSchema, "params"), getStudentParents);
router.put("/:id/parents", requirePermission("students:write"), validate(IdParamSchema, "params"), assignStudentParents);

router.get("/:id/documents/:documentId/url", parentOnly, requirePermission("students:read:child"), validate(StudentDocumentParamSchema, "params"), getParentStudentDocumentUrl);
router.get("/:id/documents/:documentId/url", requireAnyPermission("students:read", "students:read:own"), validate(StudentDocumentParamSchema, "params"), getStudentDocumentUrl);

router.get("/:id/document-recoveries", parentOnly, requirePermission("students:read:child"), validate(IdParamSchema, "params"), getStudentDocumentRecoveryHistory);
router.get("/:id/document-recoveries", requireAnyPermission("students:read", "students:read:own"), validate(IdParamSchema, "params"), getStudentDocumentRecoveryHistory);
router.get("/:id/document-recoveries/:recoveryId/preview", parentOnly, requirePermission("students:read:child"), previewStudentDocumentRecovery);
router.get("/:id/document-recoveries/:recoveryId/preview", requireAnyPermission("students:read", "students:read:own"), previewStudentDocumentRecovery);
router.post("/:id/document-recoveries/:recoveryId/restore", requirePermission("students:write"), restoreStudentDocumentRecovery);

router.get("/:id", parentOnly, requirePermission("students:read:child"), validate(IdParamSchema, "params"), getParentStudentById);
router.get("/:id", requireAnyPermission("students:read", "students:read:own"), validate(IdParamSchema, "params"), getStudentById);
router.post("/", requirePermission("students:write"), validate(CreateStudentSchema), createStudent);
router.put("/:id", requirePermission("students:write"), validate(IdParamSchema, "params"), validate(UpdateStudentSchema), updateStudent);
router.delete("/:id", requirePermission("students:delete"), validate(IdParamSchema, "params"), deleteStudent);
router.post("/bulk-import", requirePermission("students:write"), upload.single("file"), bulkImportStudents);
router.post("/:id/documents", requirePermission("students:write"), validate(IdParamSchema, "params"), upload.single("file"), validateStudentDocumentUpload, uploadStudentDocument);
router.delete("/:id/documents/:documentId", requirePermission("students:write"), validate(StudentDocumentParamSchema, "params"), deleteStudentDocument);
export default router;
