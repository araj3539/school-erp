import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env, connectDB, isDevelopment } from "./config/index.js";
import { rateLimiter, authRateLimiter } from "./middleware/index.js";
import { csrfProtection } from "./middleware/csrf.js";
import { errorHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";
import { startNotificationWorker } from "./services/notificationService.js";
import { handleRazorpayWebhook } from "./controllers/paymentWebhookController.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);
const isAllowedOrigin = (origin: string): boolean =>
  allowedOrigins.includes(origin) ||
  (isDevelopment && /^https?:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(origin)) ||
  /^https:\/\/school-[a-z0-9-]+-araj3539s-projects\.vercel\.app$/.test(origin);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error("CORS origin not allowed"));
  },
  credentials: true,
}));

// Payment provider webhooks are machine-to-machine callbacks. They must see the raw
// body for HMAC verification and must bypass browser CSRF checks.
app.post("/api/v1/payments/webhooks/razorpay", express.raw({ type: "application/json", limit: "2mb" }), (req, res, next) => {
  void handleRazorpayWebhook(Object.assign(req, { rawBody: req.body as Buffer }), res).catch(next);
});

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb", parameterLimit: 100 }));
app.use(cookieParser());
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));
app.use(csrfProtection);
app.use(rateLimiter);
app.use("/api/v1/auth", authRateLimiter);
app.use("/api/v1", routes);
app.use(errorHandler);

export async function startServer() {
  await connectDB();
  const port = env.PORT;
  app.listen(port, () => console.log(`Server running on port ${port} in ${env.NODE_ENV} mode`));
  await startNotificationWorker();
}

export default app;
