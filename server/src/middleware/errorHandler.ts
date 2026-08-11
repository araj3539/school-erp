import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { AppError } from "../utils/errors";
import { isDevelopment } from "../config";

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "File too large. Maximum size is 5MB", code: "FILE_TOO_LARGE" });
      return;
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      res.status(400).json({ error: "Too many files", code: "TOO_MANY_FILES" });
      return;
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      res.status(400).json({ error: "Unexpected file field", code: "UNEXPECTED_FILE" });
      return;
    }
    res.status(400).json({ error: err.message, code: "UPLOAD_ERROR" });
    return;
  }

  if (err.name === "ValidationError" && "errors" in err) {
    const mongooseErr = err as any;
    const messages = Object.values(mongooseErr.errors).map((e: any) => e.message);
    res.status(400).json({
      error: messages.join("; "),
      code: "VALIDATION_ERROR"
    });
    return;
  }

  if (err.name === "MongoServerError" && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    res.status(409).json({
      error: `${field} already exists`,
      code: "DUPLICATE_ENTRY"
    });
    return;
  }

  if (err.name === "JsonWebTokenError") {
    res.status(401).json({ error: "Invalid token", code: "INVALID_TOKEN" });
    return;
  }

  if (err.name === "TokenExpiredError") {
    res.status(401).json({ error: "Token expired", code: "TOKEN_EXPIRED" });
    return;
  }

  console.error("Error:", err);
  res.status(500).json({
    error: isDevelopment ? err.message : "Internal server error",
    code: "INTERNAL_ERROR"
  });
}
