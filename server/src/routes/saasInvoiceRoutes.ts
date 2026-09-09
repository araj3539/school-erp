import { Router } from "express";
import { authenticate, requirePlatformRole, validate } from "../middleware/index.js";
import { getSaaSBillingHistoryController, voidSaaSInvoiceController } from "../controllers/saasInvoiceController.js";
import { ObjectIdSchema } from "@school-erp/shared";
import { z } from "zod";

const router = Router();
router.use(authenticate);
router.get("/history", getSaaSBillingHistoryController);
router.post("/:invoiceId/void", requirePlatformRole, validate(z.object({ invoiceId: ObjectIdSchema }), "params"), voidSaaSInvoiceController);

export default router;
