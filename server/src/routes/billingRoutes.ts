import { Router } from "express";
import { authenticate, requirePlatformRole, validate } from "../middleware/index.js";
import { changeSubscriptionPlanController, createPlanVersionController, createProductVersionController, createSubscriptionController, getSubscriptionController, transitionSubscriptionController } from "../controllers/billingController.js";
import { ChangeSubscriptionPlanSchema, CreatePlanVersionSchema, CreateProductVersionSchema, CreateSubscriptionSchema, SchoolIdParamSchema, TransitionSubscriptionSchema } from "../validators/billingValidators.js";

const router = Router();
router.use(authenticate, requirePlatformRole);
router.post("/products/versions", validate(CreateProductVersionSchema), createProductVersionController);
router.post("/plans/versions", validate(CreatePlanVersionSchema), createPlanVersionController);
router.post("/subscriptions", validate(CreateSubscriptionSchema), createSubscriptionController);
router.get("/subscriptions/:schoolId", validate(SchoolIdParamSchema, "params"), getSubscriptionController);
router.post("/subscriptions/:schoolId/transition", validate(SchoolIdParamSchema, "params"), validate(TransitionSubscriptionSchema), transitionSubscriptionController);
router.post("/subscriptions/:schoolId/plan", validate(SchoolIdParamSchema, "params"), validate(ChangeSubscriptionPlanSchema), changeSubscriptionPlanController);

export default router;
