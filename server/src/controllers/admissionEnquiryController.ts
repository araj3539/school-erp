import { NextFunction, Request, Response } from "express";
import { createAdmissionEnquiry, listAdmissionEnquiries, updateAdmissionEnquiry } from "../services/admissionEnquiryService.js";
import { AdmissionEnquiryCreateSchema, AdmissionEnquiryQuerySchema, AdmissionEnquiryUpdateSchema } from "../validators/admissionEnquiry.js";

export async function list(req: Request, res: Response, next: NextFunction) { try { const query = AdmissionEnquiryQuerySchema.parse(req.query); req.query = query as any; res.json(await listAdmissionEnquiries(req)); } catch (e) { next(e); } }
export async function create(req: Request, res: Response, next: NextFunction) { try { res.status(201).json(await createAdmissionEnquiry(req, AdmissionEnquiryCreateSchema.parse(req.body))); } catch (e) { next(e); } }
export async function update(req: Request, res: Response, next: NextFunction) { try { res.json(await updateAdmissionEnquiry(req, req.params.id, AdmissionEnquiryUpdateSchema.parse(req.body))); } catch (e) { next(e); } }
