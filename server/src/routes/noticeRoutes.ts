import { Router } from "express";
import { authenticate, requirePermission, requireAnyPermission, validate } from "../middleware/index.js";
import { createNotice, getNotices, updateNotice } from "../controllers/noticeController.js";
import { CreateNoticeSchema, IdParamSchema, NoticeQuerySchema, UpdateNoticeSchema } from "../validators/index.js";

const router = Router();
router.use(authenticate);
router.get("/", requireAnyPermission("notices:read", "notices:read:own", "notices:read:child"), validate(NoticeQuerySchema, "query"), getNotices);
router.post("/", requirePermission("notices:write"), validate(CreateNoticeSchema), createNotice);
router.patch("/:id", requirePermission("notices:write"), validate(IdParamSchema, "params"), validate(UpdateNoticeSchema), updateNotice);
export default router;
