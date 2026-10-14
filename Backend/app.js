require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const { connectDB } = require("./config/db");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");
const ApiError = require("./utils/ApiError");
const passport = require("passport");


const app = express();

// ─── Trust Proxy ────────────────────────────────────────────────────────────
// Only trust first proxy hop (NGINX / Cloudflare / ALB in production)
app.set("trust proxy", process.env.NODE_ENV === "production" ? 1 : false);

// ─── Database ────────────────────────────────────────────────────────────────
connectDB();

// ─── 1. Helmet — Security Headers ────────────────────────────────────────────
// Hardened: disables X-Powered-By, sets CSP, HSTS, XSS filters, etc.
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"], // needed for swagger-ui
                imgSrc: ["'self'", "data:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                frameSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        },
        crossOriginEmbedderPolicy: false, // swagger-ui needs this off
        crossOriginResourcePolicy: { policy: "cross-origin" },
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true,
        },
        referrerPolicy: { policy: "strict-origin-when-cross-origin" },
        noSniff: true,
        xssFilter: true,
        hidePoweredBy: true,
        frameguard: { action: "deny" },
    })
);

// ─── 2. CORS ─────────────────────────────────────────────────────────────────
// Local dev plus the live Vercel app. ALLOWED_ORIGINS adds more; it does not replace these.
const defaultOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://gmb-project-seven.vercel.app",
];
const envOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new ApiError(403, "Origin is not allowed", "CORS_FORBIDDEN"));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Accept"],
        exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining"],
        maxAge: 86400, // preflight cache 24h
    })
);

// ─── 3. Compression ──────────────────────────────────────────────────────────
// Gzip all responses — cuts bandwidth by ~70% under load
app.use(compression({ level: 6, threshold: 1024 }));

// ─── 4. Body Parsers ─────────────────────────────────────────────────────────
// Hard cap on body size — prevents payload-based DoS
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));
app.use(cookieParser());

// ─── 5. Global Rate Limiter ───────────────────────────────────────────────────
// 500 req / 10 min per IP — handles 10k concurrent users while blocking floods
const globalLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests from this IP, please try again after 10 minutes",
    },
    skip: (req) => req.path === "/api/v1/health", // never limit health checks
});
app.use(globalLimiter);

// ─── 5b. Passport — stateless OAuth (no session) ─────────────────────────────
// passport.initialize() is required even when session: false.
// We do NOT call passport.session() so no cookies are created by passport.
app.use(passport.initialize());


// ─── 6. Routes ───────────────────────────────────────────────────────────────
app.use("/api/v1", routes);

app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "API is running",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
