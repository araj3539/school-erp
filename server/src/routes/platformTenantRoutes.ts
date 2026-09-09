import { Router } from "express";
import { authenticate, requirePlatformRole, validate } from "../middleware/index.js";
import { listPlatformTenants, updatePlatformTenantLifecycle } from "../controllers/platformTenantController.js";
import { provisionTenantController } from "../controllers/tenantOnboardingController.js";
import { PlatformTenantIdSchema, PlatformTenantQuerySchema, UpdateTenantLifecycleSchema } from "../validators/platformTenantValidators.js";
import { TenantOnboardingSchema } from "../validators/tenantOnboardingValidators.js";

const router = Router();
router.use(authenticate, requirePlatformRole);
router.post("/tenants/provision", validate(TenantOnboardingSchema), provisionTenantController);
router.get("/tenants", validate(PlatformTenantQuerySchema, "query"), listPlatformTenants);
router.patch("/tenants/:id/lifecycle", validate(PlatformTenantIdSchema, "params"), validate(UpdateTenantLifecycleSchema), updatePlatformTenantLifecycle);
export default router;
