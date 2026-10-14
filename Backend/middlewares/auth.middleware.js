const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { resolveRole } = require("../constants/roles");
const { assertSessionCurrent } = require("../utils/session");

const authenticate = async (req, res, next) => {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;

        if (!token) {
            throw new ApiError(401, "Not authorized — no token provided", "TOKEN_MISSING");
        }
        if (!process.env.JWT_ACCESS_SECRET) {
            throw new ApiError(500, "Token verification is not configured", "JWT_ACCESS_SECRET_MISSING");
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                throw new ApiError(401, "Access token expired — please refresh", "TOKEN_EXPIRED");
            }
            if (error.name === "NotBeforeError") {
                throw new ApiError(401, "Token not yet active", "TOKEN_NOT_ACTIVE");
            }
            throw new ApiError(401, "Invalid token — please login again", "TOKEN_INVALID");
        }

        const user = await User.findById(decoded.id).select("+userType");
        if (!user) {
            throw new ApiError(401, "User belonging to this token no longer exists", "USER_NOT_FOUND");
        }

        if (user.status === "BLOCKED") {
            throw new ApiError(403, "Your account has been blocked. Please contact support.", "ACCOUNT_BLOCKED");
        }
        if (user.status === "INACTIVE") {
            throw new ApiError(403, "Your account is inactive. Please contact support.", "ACCOUNT_INACTIVE");
        }

        assertSessionCurrent(user, decoded);

        const role = resolveRole(user);
        if (!role) {
            throw new ApiError(403, "Account role is not valid", "ROLE_INVALID");
        }
        if (decoded.role && decoded.role !== role && decoded.role !== "ADMIN") {
            throw new ApiError(401, "Session role is no longer valid — please login again", "ROLE_MISMATCH");
        }

        user.role = role;
        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

const authorize = (...roles) => (req, res, next) => {
    if (!req.user) {
        return next(new ApiError(401, "Not authenticated", "TOKEN_MISSING"));
    }
    if (!roles.includes(req.user.role)) {
        return next(new ApiError(403, "You do not have permission to access this resource", "FORBIDDEN"));
    }
    next();
};

module.exports = { authenticate, authorize };
