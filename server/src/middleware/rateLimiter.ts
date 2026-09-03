import rateLimit from "express-rate-limit";
import { RATE_LIMIT_WINDOW, RATE_LIMIT_MAX } from "../config/index.js";

const isTestEnvironment = process.env.NODE_ENV === "test";

export const rateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW,
  max: RATE_LIMIT_MAX,
  skip: () => isTestEnvironment,
  message: { error: "Too many requests, please try again later", code: "RATE_LIMIT_EXCEEDED" },
  standardHeaders: true,
  legacyHeaders: false
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: () => isTestEnvironment,
  message: { error: "Too many login attempts, please try again later", code: "AUTH_RATE_LIMIT_EXCEEDED" },
  standardHeaders: true,
  legacyHeaders: false
});
