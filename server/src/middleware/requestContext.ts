import { randomUUID } from "node:crypto";
import { Request, Response, NextFunction } from "express";

const REQUEST_ID_HEADER = "x-request-id";
const MAX_REQUEST_ID_LENGTH = 128;

function normalizeRequestId(value: string | undefined): string {
  if (!value) return randomUUID();

  const candidate = value.trim();
  if (candidate.length === 0 || candidate.length > MAX_REQUEST_ID_LENGTH) {
    return randomUUID();
  }

  return /^[A-Za-z0-9._:-]+$/.test(candidate) ? candidate : randomUUID();
}

export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const requestId = normalizeRequestId(req.get(REQUEST_ID_HEADER));
  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}

export function logRequestCompletion(req: Request, res: Response, startedAt: number): void {
  const durationMs = Math.max(0, Date.now() - startedAt);
  console.log(JSON.stringify({
    event: "http_request",
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    durationMs,
  }));
}

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}
