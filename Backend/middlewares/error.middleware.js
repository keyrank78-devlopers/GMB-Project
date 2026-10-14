const ApiError = require("../utils/ApiError");

const notFound = (req, res, next) => {
    next(new ApiError(404, "Route not found", "ROUTE_NOT_FOUND"));
};

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            code: err.code,
            ...(err.errors ? { errors: err.errors } : {}),
        });
    }

    if (err instanceof SyntaxError && err.status === 400 && Object.prototype.hasOwnProperty.call(err, "body")) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON body",
            code: "INVALID_JSON",
        });
    }

    if (err.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: `Invalid ${err.path}`,
            code: "INVALID_ID",
        });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || "field";
        return res.status(409).json({
            success: false,
            message: `An account with this ${field} already exists`,
            code: "DUPLICATE_ACCOUNT",
        });
    }

    if (err.name === "ValidationError") {
        const errors = Object.values(err.errors).map((item) => ({
            field: item.path,
            message: item.message,
        }));
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            code: "VALIDATION_ERROR",
            errors,
        });
    }

    if (err.name === "MulterError") {
        const tooLarge = err.code === "LIMIT_FILE_SIZE";
        return res.status(400).json({
            success: false,
            message: tooLarge ? "Image must be 5 MB or smaller" : "Image upload was rejected",
            code: tooLarge ? "IMAGE_TOO_LARGE" : "IMAGE_UPLOAD_INVALID",
        });
    }

    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
            success: false,
            message: "Invalid token",
            code: "TOKEN_INVALID",
        });
    }

    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
            success: false,
            message: "Token expired",
            code: "TOKEN_EXPIRED",
        });
    }

    const status = err.status || err.statusCode || 500;
    console.error(`[${new Date().toISOString()}] ERROR ${status}:`, err.stack || err.message);

    return res.status(status).json({
        success: false,
        message: process.env.NODE_ENV === "production" ? "Internal Server Error" : (err.message || "Internal Server Error"),
        code: "INTERNAL_ERROR",
    });
};

module.exports = { notFound, errorHandler };
