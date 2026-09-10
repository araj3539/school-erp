import { Router } from "express";
import { authenticate, requirePermission, validate } from "../middleware/index.js";
import { getSchoolSettings, updateSchoolSettings } from "../controllers/schoolController.js";
import { UpdateSchoolSettingsSchema } from "../validators/index.js";

const router = Router();
router.use(authenticate);
router.get("/school", requirePermission("settings:read"), getSchoolSettings);
router.put("/school", requirePermission("settings:write"), validate(UpdateSchoolSettingsSchema), updateSchoolSettings);

export default router;
