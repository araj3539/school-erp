import { Router } from "express";
import { authenticate, requirePermission, validate } from "../middleware/index.js";
import { listResultTemplates, getResultTemplateById, createResultTemplate, updateResultTemplate, archiveResultTemplate, setDefaultResultTemplate } from "../controllers/resultTemplateController.js";
import { CreateResultTemplateSchema, UpdateResultTemplateSchema, ResultTemplateQuerySchema, SetDefaultTemplateSchema } from "../validators/resultTemplate.js";
import { IdParamSchema } from "../validators/index.js";

const router = Router();
router.use(authenticate);
router.get("/", requirePermission("results:templates:read"), validate(ResultTemplateQuerySchema, "query"), listResultTemplates);
router.get("/:id", requirePermission("results:templates:read"), validate(IdParamSchema, "params"), getResultTemplateById);
router.post("/", requirePermission("results:templates:write"), validate(CreateResultTemplateSchema), createResultTemplate);
router.patch("/:id", requirePermission("results:templates:write"), validate(IdParamSchema, "params"), validate(UpdateResultTemplateSchema), updateResultTemplate);
router.delete("/:id", requirePermission("results:templates:write"), validate(IdParamSchema, "params"), archiveResultTemplate);
router.post("/:id/set-default", requirePermission("results:templates:write"), validate(IdParamSchema, "params"), validate(SetDefaultTemplateSchema), setDefaultResultTemplate);
export default router;
