import { z } from "zod";
import { ObjectIdSchema } from "@school-erp/shared";

export const FeeStructureLifecycleSchema = z.object({ status: z.enum(["active", "archived"]) });
export const FeeStructureIdParamSchema = z.object({ id: ObjectIdSchema });
