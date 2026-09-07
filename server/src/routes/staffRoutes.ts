import { Router } from "express";
import { authenticate, requirePermission, validate } from "../middleware/index.js";
import { getStaff, getStaffById, createStaff, updateStaff, deactivateStaff } from "../controllers/staffController.js";
import { CreateStaffSchema, UpdateStaffSchema, StaffQuerySchema, IdParamSchema } from "../validators/index.js";

const router = Router();

router.use(authenticate);
router.get("/", requirePermission("staff:read"), validate(StaffQuerySchema, "query"), getStaff);
router.get("/:id", requirePermission("staff:read"), validate(IdParamSchema, "params"), getStaffById);
router.post("/", requirePermission("staff:write"), validate(CreateStaffSchema), createStaff);
router.put("/:id", requirePermission("staff:write"), validate(IdParamSchema, "params"), validate(UpdateStaffSchema), updateStaff);
router.delete("/:id", requirePermission("staff:delete"), validate(IdParamSchema, "params"), deactivateStaff);

export default router;
