import { Router } from "express";
import { authenticate, validate } from "../middleware/index.js";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  getNotificationPreferences,
  upsertNotificationPreference,
} from "../controllers/notificationController.js";
import { IdParamSchema } from "../validators/index.js";
import { NotificationPreferenceSchema, NotificationQuerySchema } from "@school-erp/shared";

const router = Router();
router.use(authenticate);
router.get("/", validate(NotificationQuerySchema, "query"), getNotifications);
router.patch("/:id/read", validate(IdParamSchema, "params"), markNotificationRead);
router.post("/read-all", markAllNotificationsRead);
router.get("/preferences", getNotificationPreferences);
router.put("/preferences", validate(NotificationPreferenceSchema), upsertNotificationPreference);
export default router;
