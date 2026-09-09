import { Router } from "express";
import { authenticate, requirePermission, requireRole, validate } from "../middleware/index.js";
import { UserRole } from "@school-erp/shared";
import { getSupportAuditHistoryController, getSupportDiagnosticsController } from "../controllers/supportAccessController.js";
import { SupportAuditQuerySchema, SupportDiagnosticSchema, SupportTenantParamSchema } from "../validators/supportAccessValidators.js";

const router = Router();
router.use(authenticate, requireRole(UserRole.SUPPORT_ADMIN));
router.use((req, res, next) => {
  const selected = req.user?.schoolId;
  const target = req.params.schoolId;
  if (!selected || !target || selected !== target) {
    res.status(403).json({ error: "Explicit tenant context does not match support target" });
    return;
  }
  next();
});
router.post("/tenants/:schoolId/diagnostics", validate(SupportTenantParamSchema, "params"), validate(SupportDiagnosticSchema), requirePermission("support:read"), getSupportDiagnosticsController);
router.get("/tenants/:schoolId/audit", validate(SupportTenantParamSchema, "params"), validate(SupportAuditQuerySchema, "query"), requirePermission("support:read"), getSupportAuditHistoryController);

export default router;
