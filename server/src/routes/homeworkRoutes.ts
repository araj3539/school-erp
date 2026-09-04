import { Router } from "express";
import { authenticate, requirePermission, requireAnyPermission, validate } from "../middleware/index.js";
import { homeworkUpload, validateHomeworkAttachmentUpload } from "../middleware/upload.js";
import { createHomework, deleteHomeworkAttachment, getHomework, getHomeworkAttachmentUrl, getHomeworkById, updateHomework, uploadHomeworkAttachment } from "../controllers/homeworkController.js";
import { CreateHomeworkSchema, HomeworkQuerySchema, IdParamSchema, UpdateHomeworkSchema } from "../validators/index.js";
import { z } from "zod";
import { UserRole } from "@school-erp/shared";

const HomeworkAttachmentParamSchema = IdParamSchema.extend({ attachmentId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid attachment id") });
const denyTeacherBroadRead = (req: any, res: any, next: any) => {
  if (req.user?.role === UserRole.TEACHER) {
    res.status(403).json({ error: "Use the teacher homework workspace for assignment-scoped homework access" });
    return;
  }
  next();
};
const router = Router();
router.use(authenticate);
router.get("/", requireAnyPermission("homework:read", "homework:read:own", "homework:read:child"), denyTeacherBroadRead, validate(HomeworkQuerySchema, "query"), getHomework);
router.get("/:id/attachments/:attachmentId/url", requireAnyPermission("homework:read", "homework:read:own", "homework:read:child"), denyTeacherBroadRead, validate(HomeworkAttachmentParamSchema, "params"), getHomeworkAttachmentUrl);
router.get("/:id", requireAnyPermission("homework:read", "homework:read:own", "homework:read:child"), denyTeacherBroadRead, validate(IdParamSchema, "params"), getHomeworkById);
router.post("/", requirePermission("homework:write"), validate(CreateHomeworkSchema), createHomework);
router.patch("/:id", requirePermission("homework:write"), validate(IdParamSchema, "params"), validate(UpdateHomeworkSchema), updateHomework);
router.post("/:id/attachments", requirePermission("homework:write"), validate(IdParamSchema, "params"), homeworkUpload.single("file"), validateHomeworkAttachmentUpload, uploadHomeworkAttachment);
router.delete("/:id/attachments/:attachmentId", requirePermission("homework:write"), validate(HomeworkAttachmentParamSchema, "params"), deleteHomeworkAttachment);
export default router;
