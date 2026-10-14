const rateLimit = require("express-rate-limit");

const buildLimiter = (windowMs, max, message, code) => rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message,
        code,
    },
});

const loginLimiter = buildLimiter(
    15 * 60 * 1000,
    10,
    "Too many login attempts from this IP. Please try again after 15 minutes.",
    "LOGIN_RATE_LIMIT"
);

const registerLimiter = buildLimiter(
    60 * 60 * 1000,
    5,
    "Too many registration attempts from this IP. Please try again after 1 hour.",
    "REGISTER_RATE_LIMIT"
);

const refreshLimiter = buildLimiter(
    15 * 60 * 1000,
    60,
    "Too many token refresh requests. Please try again shortly.",
    "REFRESH_RATE_LIMIT"
);

const paymentLimiter = buildLimiter(
    15 * 60 * 1000,
    30,
    "Too many payment attempts. Please try again after 15 minutes.",
    "PAYMENT_RATE_LIMIT"
);

const uploadLimiter = buildLimiter(
    15 * 60 * 1000,
    20,
    "Too many image uploads. Please try again after 15 minutes.",
    "UPLOAD_RATE_LIMIT"
);

module.exports = { loginLimiter, registerLimiter, refreshLimiter, paymentLimiter, uploadLimiter };
