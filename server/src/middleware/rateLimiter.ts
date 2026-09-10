import rateLimit from "express-rate-limit";
import { RATE_LIMIT_WINDOW, RATE_LIMIT_MAX, isDevelopment } from "../config/index.js";

// Local development should not be blocked by browser reloads, HMR, or repeated
// authentication bootstrap requests. Production keeps the real protection.
const skipRateLimiting = isDevelopment || process.env.NODE_ENV === "test";

export const rateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW,
  max: RATE_LIMIT_MAX,
  skip: () => skipRateLimiting,
  message: { error: "Too many requests, please try again later", code: "RATE_LIMIT_EXCEEDED" },
  standardHeaders: true,
  legacyHeaders: false
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: () => skipRateLimiting,
  message: { error: "Too many login attempts, please try again later", code: "AUTH_RATE_LIMIT_EXCEEDED" },
  standardHeaders: true,
  legacyHeaders: false
});
