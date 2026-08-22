import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/index.js";
import { listAuditLogs } from "../controllers/auditLogController.js";

const router = Router();

router.use(authenticate);
router.get("/", requirePermission("audit:read"), listAuditLogs);

export default router;
