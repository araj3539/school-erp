import { Router } from "express";
import { authenticate, requireAnyPermission, validate } from "../middleware/index.js";
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
const notificationPermissions = ["notices:read", "notices:read:own", "notices:read:child"];
router.use(authenticate);
router.get("/", requireAnyPermission(...notificationPermissions), validate(NotificationQuerySchema, "query"), getNotifications);
router.patch("/:id/read", requireAnyPermission(...notificationPermissions), validate(IdParamSchema, "params"), markNotificationRead);
router.post("/read-all", requireAnyPermission(...notificationPermissions), markAllNotificationsRead);
router.get("/preferences", requireAnyPermission(...notificationPermissions), getNotificationPreferences);
router.put("/preferences", requireAnyPermission(...notificationPermissions), validate(NotificationPreferenceSchema), upsertNotificationPreference);
export default router;
