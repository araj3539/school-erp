import { Router } from "express";
import { authenticate, requirePlatformRole, validate } from "../middleware/index.js";
import { listPlatformTenants, updatePlatformTenantLifecycle } from "../controllers/platformTenantController.js";
import { PlatformTenantIdSchema, PlatformTenantQuerySchema, UpdateTenantLifecycleSchema } from "../validators/platformTenantValidators.js";

const router = Router();
router.use(authenticate, requirePlatformRole);
router.get("/tenants", validate(PlatformTenantQuerySchema, "query"), listPlatformTenants);
router.patch("/tenants/:id/lifecycle", validate(PlatformTenantIdSchema, "params"), validate(UpdateTenantLifecycleSchema), updatePlatformTenantLifecycle);
export default router;
