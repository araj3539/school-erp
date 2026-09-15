import { Router } from "express";
import { requirePermission } from "../middleware/rbac.js";
import { list, create, update } from "../controllers/admissionEnquiryController.js";

const router = Router();
router.get("/", requirePermission("students:read"), list);
router.post("/", requirePermission("students:write"), create);
router.patch("/:id", requirePermission("students:write"), update);
export default router;
