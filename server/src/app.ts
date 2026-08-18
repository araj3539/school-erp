import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env, connectDB } from "./config/index.js";
import { rateLimiter, authRateLimiter } from "./middleware/index.js";
import { csrfProtection } from "./middleware/csrf.js";
import { errorHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";

const app = express();

// Render runs the service behind a reverse proxy and forwards the client IP
// in X-Forwarded-For. Trust the first proxy so express-rate-limit can safely
// identify clients by their forwarded IP address.
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

const allowedOrigins = env.CORS_ORIGIN
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS origin not allowed"));
  },
  credentials: true,
}));

// Keep request bodies bounded to reduce parser memory/CPU abuse.
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({
  extended: true,
  limit: "1mb",
  parameterLimit: 100,
  depth: 5,
}));
app.use(cookieParser());

// Lightweight liveness endpoint for UptimeRobot. Keep it outside the API
// rate limiter so monitoring never consumes application request quota.
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Production auth uses cross-site HttpOnly cookies because the SPA and API
// are hosted on different sites. Validate browser request context before any
// state-changing API route to prevent CSRF.
app.use(csrfProtection);
app.use(rateLimiter);
app.use("/api/v1/auth/login", authRateLimiter);
app.use("/api/v1", routes);
app.use(errorHandler);

export async function startServer(): Promise<void> {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
}

export default app;
