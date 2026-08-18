import { Request, Response, NextFunction } from "express";
import { env } from "../config/index.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const allowedOrigins = env.CORS_ORIGIN
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

/**
 * Blocks browser cross-site state-changing requests while preserving support
 * for non-browser API clients that do not send an Origin header.
 *
 * Authentication uses SameSite=None cookies in production because the SPA and
 * API are hosted on different sites, so Origin/Fetch-Metadata validation is
 * required as a CSRF defense-in-depth layer.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const fetchSite = req.get("Sec-Fetch-Site");
  if (fetchSite === "cross-site") {
    res.status(403).json({ error: "Cross-site state-changing request blocked" });
    return;
  }

  const origin = req.get("Origin");
  if (origin && !allowedOrigins.includes(origin)) {
    res.status(403).json({ error: "Request origin not allowed" });
    return;
  }

  next();
}
