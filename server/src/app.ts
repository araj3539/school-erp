import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env, connectDB, getReadinessStatus, isDevelopment } from "./config/index.js";
import { rateLimiter, authRateLimiter } from "./middleware/index.js";
import { csrfProtection } from "./middleware/csrf.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logRequestCompletion, requestContext } from "./middleware/requestContext.js";
import routes from "./routes/index.js";
import { startNotificationWorker } from "./services/notificationService.js";
import { startCalendarAutomationWorker } from "./services/calendarAutomationWorker.js";
import { handleRazorpayWebhook } from "./controllers/paymentWebhookController.js";
import { disconnectDB } from "./config/index.js";
import type { Server } from "node:http";

type ServerLifecycle = { close: () => Promise<void> };
const app = express();
app.set("trust proxy", 1);
app.use(requestContext);
app.use((req, res, next) => { const startedAt = Date.now(); res.once("finish", () => logRequestCompletion(req, res, startedAt)); next(); });
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", "data:", "https:"], connectSrc: ["'self'"], fontSrc: ["'self'"], objectSrc: ["'none'"], mediaSrc: ["'self'"], frameSrc: ["'none'"] } }, crossOriginEmbedderPolicy: false }));
const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);
const isAllowedOrigin = (origin: string): boolean => allowedOrigins.includes(origin) || (isDevelopment && /^https?:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(origin)) || /^https:\/\/school-[a-z0-9-]+-araj3539s-projects\.vercel\.app$/.test(origin);
app.use(cors({ origin: (origin, callback) => { if (!origin) return callback(null, true); if (isAllowedOrigin(origin)) return callback(null, true); return callback(new Error("CORS origin not allowed")); }, credentials: true }));
app.post("/api/v1/payments/webhooks/razorpay", express.raw({ type: "application/json", limit: "2mb" }), (req, res, next) => { void handleRazorpayWebhook(Object.assign(req, { rawBody: req.body as Buffer }), res).catch(next); });
app.use(express.json({ limit: "2mb" })); app.use(express.urlencoded({ extended: true, limit: "1mb", parameterLimit: 100 })); app.use(cookieParser());
app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));
app.get("/ready", (_req, res) => { const readiness = getReadinessStatus(); res.status(readiness.ready ? 200 : 503).json({ status: readiness.ready ? "ready" : "not_ready", timestamp: new Date().toISOString(), ...readiness }); });
app.use(csrfProtection); app.use(rateLimiter); app.use("/api/v1/auth", authRateLimiter); app.use("/api/v1", routes); app.use(errorHandler);
export async function startServer(): Promise<ServerLifecycle> {
  await connectDB();
  const workerTimer = await startNotificationWorker();
  const calendarWorkerTimer = await startCalendarAutomationWorker();
  const port = env.PORT;
  const server = await new Promise<Server>((resolve) => { const httpServer = app.listen(port, () => { console.log(JSON.stringify({ event: "server_started", port, environment: env.NODE_ENV })); resolve(httpServer); }); });
  return { close: async () => { clearInterval(workerTimer); clearInterval(calendarWorkerTimer); await new Promise<void>((resolve, reject) => { server.close((error) => error ? reject(error) : resolve()); }); await disconnectDB(); } };
}
export default app;
