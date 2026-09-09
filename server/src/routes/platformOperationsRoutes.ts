import { Router } from "express";
import { authenticate, requirePlatformRole, validate } from "../middleware/index.js";
import { getPlatformOperationsOverviewController, listPlatformAuditLogsController } from "../controllers/platformOperationsController.js";
import { PlatformAuditQuerySchema } from "../validators/platformOperationsValidators.js";

const router = Router();
router.use(authenticate, requirePlatformRole);

router.get("/operations", getPlatformOperationsOverviewController);
router.get("/audit", validate(PlatformAuditQuerySchema, "query"), listPlatformAuditLogsController);

export default router;
