import { Router } from "express";
import { authenticate, requireAnyPermission, requirePermission, validate, reserveTenantUsage } from "../middleware/index.js";
import { upload, validateStudentDocumentUpload } from "../middleware/upload.js";
import { getStudents, getStudentById, getStudentDocumentUrl, createStudent, updateStudent, deleteStudent, uploadStudentDocument, deleteStudentDocument } from "../controllers/studentController.js";
import { bulkImportStudentsHardened, exportStudentsHardened } from "../controllers/studentBulkOperationsController.js";
import { getStudentParents, assignStudentParents } from "../controllers/studentParentController.js";
import { getStudentDocumentRecoveryHistory, previewStudentDocumentRecovery, restoreStudentDocumentRecovery, runManualStorageBackup } from "../controllers/documentRecoveryController.js";
import { getParentStudents, getParentStudentById, getParentStudentDocumentUrl } from "../controllers/parentStudentAccessController.js";
import { transitionStudentLifecycle, getStudentLifecycleHistory } from "../controllers/studentLifecycleController.js";
import { UserRole } from "@school-erp/shared";
import { CreateStudentSchema, PaginationSchema, StudentQuerySchema, IdParamSchema, StudentDocumentParamSchema, StudentDocumentRecoveryParamSchema, DocumentRecoveryHistoryQuerySchema, StudentLifecycleTransitionSchema, StudentLifecycleQuerySchema, UpdateStudentLifecycleSafeSchema } from "../validators/index.js";
const router = Router();
router.use(authenticate);
const parentOnly = (req: any, _res: any, next: any) => req.user?.role === UserRole.PARENT ? next() : next("route");

router.get("/", parentOnly, requirePermission("students:read:child"), validate(PaginationSchema, "query"), getParentStudents);
router.get("/", requireAnyPermission("students:read", "students:read:own"), validate(StudentQuerySchema, "query"), getStudents);
router.get("/export", requirePermission("students:read"), validate(StudentQuerySchema, "query"), exportStudentsHardened);
router.post("/document-recoveries/backup", requirePermission("settings:write"), runManualStorageBackup);
router.get("/:id/parents", requirePermission("students:read"), validate(IdParamSchema, "params"), getStudentParents);
router.put("/:id/parents", requirePermission("students:write"), validate(IdParamSchema, "params"), assignStudentParents);
router.get("/:id/lifecycle", requireAnyPermission("students:read", "students:read:own"), validate(IdParamSchema, "params"), validate(StudentLifecycleQuerySchema, "query"), getStudentLifecycleHistory);
router.post("/:id/lifecycle", requirePermission("students:write"), validate(IdParamSchema, "params"), validate(StudentLifecycleTransitionSchema), transitionStudentLifecycle);

router.get("/:id/documents/:documentId/url", parentOnly, requirePermission("students:read:child"), validate(StudentDocumentParamSchema, "params"), getParentStudentDocumentUrl);
router.get("/:id/documents/:documentId/url", requireAnyPermission("students:read", "students:read:own"), validate(StudentDocumentParamSchema, "params"), getStudentDocumentUrl);

router.get("/:id/document-recoveries", parentOnly, requirePermission("students:read:child"), validate(IdParamSchema, "params"), validate(DocumentRecoveryHistoryQuerySchema, "query"), getStudentDocumentRecoveryHistory);
router.get("/:id/document-recoveries", requireAnyPermission("students:read", "students:read:own"), validate(IdParamSchema, "params"), validate(DocumentRecoveryHistoryQuerySchema, "query"), getStudentDocumentRecoveryHistory);
router.get("/:id/document-recoveries/:recoveryId/preview", parentOnly, requirePermission("students:read:child"), validate(StudentDocumentRecoveryParamSchema, "params"), previewStudentDocumentRecovery);
router.get("/:id/document-recoveries/:recoveryId/preview", requireAnyPermission("students:read", "students:read:own"), validate(StudentDocumentRecoveryParamSchema, "params"), validate(StudentDocumentRecoveryParamSchema, "params"), previewStudentDocumentRecovery);
router.post("/:id/document-recoveries/:recoveryId/restore", requirePermission("students:write"), validate(StudentDocumentRecoveryParamSchema, "params"), restoreStudentDocumentRecovery);

router.get("/:id", parentOnly, requirePermission("students:read:child"), validate(IdParamSchema, "params"), getParentStudentById);
router.get("/:id", requireAnyPermission("students:read", "students:read:own"), validate(IdParamSchema, "params"), getStudentById);
router.post("/", requirePermission("students:write"), validate(CreateStudentSchema), reserveTenantUsage("students"), createStudent);
router.put("/:id", requirePermission("students:write"), validate(IdParamSchema, "params"), validate(UpdateStudentLifecycleSafeSchema), updateStudent);
router.delete("/:id", requirePermission("students:delete"), validate(IdParamSchema, "params"), (req, _res, next) => { req.validatedBody = { toStatus: "left", reason: "Student marked as left through the lifecycle workflow" }; transitionStudentLifecycle(req, _res, next); });
router.post("/bulk-import", requirePermission("students:write"), upload.single("file"), bulkImportStudentsHardened);
router.post("/:id/documents", requirePermission("students:write"), validate(IdParamSchema, "params"), upload.single("file"), validateStudentDocumentUpload, uploadStudentDocument);
router.delete("/:id/documents/:documentId", requirePermission("students:write"), validate(StudentDocumentParamSchema, "params"), deleteStudentDocument);
export default router;
