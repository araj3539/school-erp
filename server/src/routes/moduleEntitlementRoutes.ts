import { Router } from "express";
import { authenticate, requirePlatformRole, validate } from "../middleware/index.js";
import { getModuleEntitlementsController, setModuleEntitlementController } from "../controllers/moduleEntitlementController.js";
import { ModuleEntitlementUpdateSchema, ModuleIdSchema } from "../validators/moduleEntitlementValidators.js";

const router = Router();
router.use(authenticate);
router.get("/", getModuleEntitlementsController);
router.put("/platform/tenants/:schoolId/modules/:moduleId", requirePlatformRole, validate(ModuleIdSchema, "params"), validate(ModuleEntitlementUpdateSchema), setModuleEntitlementController);

export default router;
