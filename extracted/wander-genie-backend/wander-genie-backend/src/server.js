require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const { notFound: notFoundRes } = require("./utils/response");

// ─── App ─────────────────────────────────────────────────────────────────────
const app = express();

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow server-to-server or same-origin calls
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ─── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests — please try again later" },
});
app.use(limiter);

// Stricter limit for generate endpoint
const generateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { success: false, message: "Itinerary generation limit reached — please wait a moment" },
});
app.use(["/api/trips/generate", "/generate-itinerary"], generateLimiter);

// ─── General middleware ───────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "WanderGenie API is running 🧞",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use("/api", routes);

// Legacy direct route (frontend calls /generate-itinerary at root)
app.post("/generate-itinerary", ...require("./routes/index").stack
  ? [] // already mounted via /api; duplicate handled in routes/index.js
  : []);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => notFoundRes(res, `Route ${req.method} ${req.originalUrl} not found`));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🧞  WanderGenie backend running on port ${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV}`);
    console.log(`   Health      : http://localhost:${PORT}/health`);
    console.log(`   API base    : http://localhost:${PORT}/api\n`);
  });
};

start();

module.exports = app; // for testing
