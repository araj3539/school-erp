import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env, connectDB, isDevelopment } from "./config/index.js";
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

// Vercel generates a new preview hostname for each deployment. Keep the
// allowlist explicit for production/custom domains while permitting only
// this project's Vercel deployment namespace for previews.
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

// Keep request bodies bounded to reduce parser memory/CPU abuse.
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({
  extended: true,
  limit: "1mb",
  parameterLimit: 100,
}));
app.use(cookieParser());

// Lightweight liveness endpoint for UptimeRobot. Keep it outside the API
// prefix so monitoring can use /health without authentication.
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.use(rateLimiter);
app.use("/api/v1/auth", authRateLimiter);
app.use("/api/v1", routes);

app.use(errorHandler);

export async function startServer() {
  await connectDB();
  const port = env.PORT;
  app.listen(port, () => console.log(`Server running on port ${port} in ${env.NODE_ENV} mode`));
}

export default app;
