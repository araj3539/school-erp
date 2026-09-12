import { z } from "zod";
import { ObjectIdSchema } from "@school-erp/shared";
export const SectionGovernanceSchema=z.object({classId:ObjectIdSchema,sectionId:ObjectIdSchema,capacity:z.coerce.number().int().positive().max(1000).optional()});
export const SectionAssignmentSchema=z.object({studentIds:z.array(ObjectIdSchema).min(1).max(1000),classId:ObjectIdSchema,sectionId:ObjectIdSchema,confirm:z.literal(true)});
