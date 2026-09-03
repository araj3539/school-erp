import { Router } from "express";
import { authenticate, requirePermission, requireAnyPermission, validate } from "../middleware/index.js";
import { createHomework, getHomework, getHomeworkById, updateHomework } from "../controllers/homeworkController.js";
import { CreateHomeworkSchema, HomeworkQuerySchema, IdParamSchema, UpdateHomeworkSchema } from "../validators/index.js";

const router = Router();
router.use(authenticate);
router.get("/", requireAnyPermission("homework:read", "homework:read:own", "homework:read:child"), validate(HomeworkQuerySchema, "query"), getHomework);
router.get("/:id", requireAnyPermission("homework:read", "homework:read:own", "homework:read:child"), validate(IdParamSchema, "params"), getHomeworkById);
router.post("/", requirePermission("homework:write"), validate(CreateHomeworkSchema), createHomework);
router.patch("/:id", requirePermission("homework:write"), validate(IdParamSchema, "params"), validate(UpdateHomeworkSchema), updateHomework);
export default router;
