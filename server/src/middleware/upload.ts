import multer from "multer";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FIELDS = 20;
const FIELD_NESTING_DEPTH = 2;
const ALLOWED_MIME_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel",
];
const HOMEWORK_MIME_TYPES = [
  ...ALLOWED_MIME_TYPES,
  "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

function hasPrefix(buffer: Buffer, prefix: number[], offset = 0): boolean {
  return buffer.length >= offset + prefix.length && prefix.every((byte, index) => buffer[offset + index] === byte);
}
function looksLikePdf(buffer: Buffer): boolean { return buffer.subarray(0, 5).toString("ascii") === "%PDF-"; }
function looksLikeJpeg(buffer: Buffer): boolean { return hasPrefix(buffer, [0xff, 0xd8, 0xff]); }
function looksLikePng(buffer: Buffer): boolean { return hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); }
function looksLikeGif(buffer: Buffer): boolean { const header = buffer.subarray(0, 6).toString("ascii"); return header === "GIF87a" || header === "GIF89a"; }
function looksLikeWebp(buffer: Buffer): boolean { return buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP"; }

const fileSignatures: Record<string, (buffer: Buffer) => boolean> = {
  "application/pdf": looksLikePdf, "image/jpeg": looksLikeJpeg, "image/png": looksLikePng,
  "image/gif": looksLikeGif, "image/webp": looksLikeWebp,
};

export function validateUploadedFileSignature(file: Express.Multer.File): void {
  const validator = fileSignatures[file.mimetype];
  if (validator && !validator(file.buffer)) throw new AppError("Uploaded file contents do not match the declared file type", 400, "INVALID_FILE_SIGNATURE");
}

export function validateStudentDocumentUpload(req: Request, _res: Response, next: NextFunction): void {
  try {
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) throw new AppError("Document file is required", 400, "FILE_REQUIRED");
    validateUploadedFileSignature(file); next();
  } catch (error) { next(error); }
}

function makeFileFilter(allowedTypes: string[]) {
  return (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new AppError(`File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(", ")}`, 400, "INVALID_FILE_TYPE"));
  };
}
const storage = multer.memoryStorage();
const limits = { fileSize: MAX_FILE_SIZE, files: 1, fields: MAX_FIELDS, fieldNestingDepth: FIELD_NESTING_DEPTH };

export const upload = multer({ storage, limits, fileFilter: makeFileFilter(ALLOWED_MIME_TYPES) });
export const homeworkUpload = multer({ storage, limits, fileFilter: makeFileFilter(HOMEWORK_MIME_TYPES) });
export const uploadMultiple = multer({ storage, limits: { ...limits, files: 10 }, fileFilter: makeFileFilter(ALLOWED_MIME_TYPES) });

export function validateHomeworkAttachmentUpload(req: Request, _res: Response, next: NextFunction): void {
  try {
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) throw new AppError("Attachment file is required", 400, "FILE_REQUIRED");
    validateUploadedFileSignature(file); next();
  } catch (error) { next(error); }
}
