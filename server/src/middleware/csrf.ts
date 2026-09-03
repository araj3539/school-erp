import { Request, Response, NextFunction } from "express";
import { env } from "../config/index.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const allowedOrigins = env.CORS_ORIGIN
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin: string): boolean =>
  allowedOrigins.includes(origin) ||
  /^https:\/\/school-[a-z0-9-]+-araj3539s-projects\.vercel\.app$/.test(origin);

/**
 * Blocks unauthorized browser state-changing requests while allowing the
 * legitimate cross-site SPA -> API requests used by the production app.
 *
 * The SPA and API live on different origins, so Sec-Fetch-Site is expected to
 * be "cross-site" for legitimate requests. Origin is therefore the primary
 * browser CSRF check, while Fetch Metadata is only used as a fallback when no
 * Origin header is present.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const origin = req.get("Origin");

  // Browser requests with an Origin must come from an explicitly configured
  // frontend origin or this project's Vercel deployment namespace. This keeps
  // preview deployments working without opening state-changing requests to
  // arbitrary websites.
  if (origin) {
    if (!isAllowedOrigin(origin)) {
      res.status(403).json({ error: "Request origin not allowed" });
      return;
    }

    next();
    return;
  }

  // Requests without Origin can be legitimate non-browser API clients. Keep
  // those working, but reject a browser Fetch-Metadata signal that explicitly
  // identifies the request as cross-site.
  const fetchSite = req.get("Sec-Fetch-Site");
  if (fetchSite === "cross-site") {
    res.status(403).json({ error: "Cross-site state-changing request blocked" });
    return;
  }

  next();
}
