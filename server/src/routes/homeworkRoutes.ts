import { Router } from "express";
import { authenticate, requirePermission, requireAnyPermission, validate } from "../middleware/index.js";
import { homeworkUpload, validateHomeworkAttachmentUpload } from "../middleware/upload.js";
import { createHomework, deleteHomeworkAttachment, getHomework, getHomeworkAttachmentUrl, getHomeworkById, updateHomework, uploadHomeworkAttachment } from "../controllers/homeworkController.js";
import { CreateHomeworkSchema, HomeworkQuerySchema, IdParamSchema, UpdateHomeworkSchema } from "../validators/index.js";
import { z } from "zod";

const HomeworkAttachmentParamSchema = IdParamSchema.extend({ attachmentId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid attachment id") });
const router = Router();
router.use(authenticate);
router.get("/", requireAnyPermission("homework:read", "homework:read:own", "homework:read:child"), validate(HomeworkQuerySchema, "query"), getHomework);
router.get("/:id/attachments/:attachmentId/url", requireAnyPermission("homework:read", "homework:read:own", "homework:read:child"), validate(HomeworkAttachmentParamSchema, "params"), getHomeworkAttachmentUrl);
router.get("/:id", requireAnyPermission("homework:read", "homework:read:own", "homework:read:child"), validate(IdParamSchema, "params"), getHomeworkById);
router.post("/", requirePermission("homework:write"), validate(CreateHomeworkSchema), createHomework);
router.patch("/:id", requirePermission("homework:write"), validate(IdParamSchema, "params"), validate(UpdateHomeworkSchema), updateHomework);
router.post("/:id/attachments", requirePermission("homework:write"), validate(IdParamSchema, "params"), homeworkUpload.single("file"), validateHomeworkAttachmentUpload, uploadHomeworkAttachment);
router.delete("/:id/attachments/:attachmentId", requirePermission("homework:write"), validate(HomeworkAttachmentParamSchema, "params"), deleteHomeworkAttachment);
export default router;
