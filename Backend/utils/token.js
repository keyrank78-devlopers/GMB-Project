const jwt = require("jsonwebtoken");
const ApiError = require("./ApiError");

const signToken = (payload, secret, expiresIn, missingCode) => {
    if (!secret) {
        throw new ApiError(500, "Token signing is not configured", missingCode);
    }
    return jwt.sign(payload, secret, { expiresIn });
};

const generateAccessToken = (userId, role, sessionVersion = 0) => {
    return signToken(
        { id: userId, role, sv: sessionVersion },
        process.env.JWT_ACCESS_SECRET,
        process.env.ACCESS_TOKEN_EXPIRY || "15m",
        "JWT_ACCESS_SECRET_MISSING"
    );
};

const generateRefreshToken = (userId, role, sessionVersion = 0) => {
    return signToken(
        { id: userId, role, sv: sessionVersion },
        process.env.JWT_REFRESH_SECRET,
        process.env.REFRESH_TOKEN_EXPIRY || "7d",
        "JWT_REFRESH_SECRET_MISSING"
    );
};

const verifyRefreshToken = (token) => {
    if (!process.env.JWT_REFRESH_SECRET) {
        throw new ApiError(500, "Token verification is not configured", "JWT_REFRESH_SECRET_MISSING");
    }
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
};
