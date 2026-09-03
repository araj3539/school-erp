import { Router } from "express";
import { authenticate, requirePermission, requireAnyPermission, validate } from "../middleware/index.js";
import { createTimetable, deleteTimetable, getTimetable, updateTimetable } from "../controllers/timetableController.js";
import { CreateTimetableSchema, IdParamSchema, TimetableQuerySchema, UpdateTimetableSchema } from "../validators/index.js";

const router = Router();
router.use(authenticate);
router.get("/", requireAnyPermission("timetable:read", "timetable:read:own", "timetable:read:child"), validate(TimetableQuerySchema, "query"), getTimetable);
router.post("/", requirePermission("timetable:write"), validate(CreateTimetableSchema), createTimetable);
router.patch("/:id", requirePermission("timetable:write"), validate(IdParamSchema, "params"), validate(UpdateTimetableSchema), updateTimetable);
router.delete("/:id", requirePermission("timetable:write"), validate(IdParamSchema, "params"), deleteTimetable);
export default router;
