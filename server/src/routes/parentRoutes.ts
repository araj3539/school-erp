import { Router } from "express";
import { authenticate, requirePermission, validate } from "../middleware/index.js";
import { getMyChildren, getMyChild, getMyChildAttendance, getMyChildFees } from "../controllers/parentController.js";
import { IdParamSchema, DateRangeQuerySchema } from "../validators/index.js";

const router = Router();
router.use(authenticate);
router.get("/children", requirePermission("students:read:child"), getMyChildren);
router.get("/children/:id", requirePermission("students:read:child"), validate(IdParamSchema, "params"), getMyChild);
router.get("/children/:id/attendance", requirePermission("attendance:read:child"), validate(IdParamSchema, "params"), validate(DateRangeQuerySchema, "query"), getMyChildAttendance);
router.get("/children/:id/fees", requirePermission("fees:read:child"), validate(IdParamSchema, "params"), getMyChildFees);

export default router;
