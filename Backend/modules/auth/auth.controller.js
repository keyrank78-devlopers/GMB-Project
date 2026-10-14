const asyncHandler = require("../../middlewares/asyncHandler");
const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const { toPublicUser } = require("../../utils/userResponse");
const { rotateSession, clearSession } = require("./auth.service");

const refreshToken = asyncHandler(async (req, res) => {
    const session = await rotateSession(res, req.cookies.refreshToken);
    res.status(200).json({
        success: true,
        message: "Token refreshed",
        data: session,
    });
});

const logout = asyncHandler(async (req, res) => {
    await clearSession(req.user._id, res);
    res.status(200).json({ success: true, message: "Logged out successfully" });
});

const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("+userType");
    if (!user) {
        throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }

    res.status(200).json({
        success: true,
        data: toPublicUser(user),
    });
});

module.exports = { refreshToken, logout, getMe };
