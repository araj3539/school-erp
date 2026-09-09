import { Router } from "express";
import { authenticate, requirePlatformRole, validate } from "../middleware/index.js";
import { getPlatformTenantUsage, setPlatformTenantLimit } from "../controllers/tenantUsageController.js";
import { TenantLimitParamSchema, TenantLimitSchema, TenantUsageParamSchema } from "../validators/tenantUsageValidators.js";

const router = Router();
router.use(authenticate, requirePlatformRole);
router.get("/tenants/:schoolId", validate(TenantUsageParamSchema, "params"), getPlatformTenantUsage);
router.put("/tenants/:schoolId/limits/:dimension", validate(TenantLimitParamSchema, "params"), validate(TenantLimitSchema), setPlatformTenantLimit);
export default router;
