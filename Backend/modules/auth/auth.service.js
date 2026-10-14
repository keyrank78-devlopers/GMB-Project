const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const { ROLES, resolveRole } = require("../../constants/roles");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../../utils/token");
const { assertSessionCurrent, sessionVersionOf } = require("../../utils/session");
const { toPublicUser } = require("../../utils/userResponse");

const cookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
});

const assertAccountActive = (user) => {
    if (user.status === "BLOCKED") {
        throw new ApiError(403, "Account is blocked. Contact support.", "ACCOUNT_BLOCKED");
    }
    if (user.status === "INACTIVE") {
        throw new ApiError(403, "Account is not active. Contact support.", "ACCOUNT_INACTIVE");
    }
};

const registerSuperadmin = async ({ name, email, phone, username, password }) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedUsername = String(username || "").trim().toLowerCase();
    const existing = await User.findOne({
        $or: [{ email: normalizedEmail }, { phone }, { username: normalizedUsername }],
    }).select("email phone username");

    if (existing) {
        const field = existing.email === normalizedEmail
            ? "email"
            : existing.username === normalizedUsername
                ? "username"
                : "phone";
        throw new ApiError(409, `An account with this ${field} already exists`, "DUPLICATE_ACCOUNT");
    }

    return User.create({
        role: ROLES.SUPERADMIN,
        name,
        email: normalizedEmail,
        phone,
        username: normalizedUsername,
        password,
    });
};

const registerVendor = async ({ name, phone, username, password, companyName }) => {
    const normalizedUsername = String(username || "").trim().toLowerCase();
    const existing = await User.findOne({
        $or: [{ username: normalizedUsername }, { phone }],
    }).select("username phone");

    if (existing) {
        const field = existing.username === normalizedUsername ? "username" : "phone";
        throw new ApiError(409, `An account with this ${field} already exists`, "DUPLICATE_ACCOUNT");
    }

    return User.create({
        role: ROLES.VENDOR,
        name,
        phone,
        username: normalizedUsername,
        password,
        companyName,
    });
};

const findAccountByEmail = (email) => {
    return User.findOne({ email }).select("+password +userType");
};

const loginWithUsername = async (username, password, expectedRole) => {
    const normalizedUsername = String(username || "").trim().toLowerCase();
    const user = await User.findOne({ username: normalizedUsername }).select("+password +userType");
    if (!user) {
        throw new ApiError(401, "Invalid username or password", "INVALID_CREDENTIALS");
    }

    const passwordMatches = await user.matchPassword(password);
    if (!passwordMatches) {
        throw new ApiError(401, "Invalid username or password", "INVALID_CREDENTIALS");
    }

    const role = resolveRole(user);
    if (role !== expectedRole) {
        throw new ApiError(403, "This account cannot use vendor login", "ROLE_MISMATCH");
    }

    assertAccountActive(user);
    if (user.role !== role) user.role = role;
    return user;
};

const loginWithRole = async (email, password, expectedRole) => {
    const user = await findAccountByEmail(email);
    if (!user) {
        throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const passwordMatches = await user.matchPassword(password);
    if (!passwordMatches) {
        throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const role = resolveRole(user);
    if (role !== expectedRole) {
        const portal = expectedRole === ROLES.SUPERADMIN ? "superadmin" : "vendor";
        throw new ApiError(403, `This account cannot use ${portal} login`, "ROLE_MISMATCH");
    }

    assertAccountActive(user);
    if (user.role !== role) user.role = role;
    return user;
};

const issueSession = async (res, user) => {
    const role = resolveRole(user);
    const sessionVersion = sessionVersionOf(user);
    const accessToken = generateAccessToken(user._id, role, sessionVersion);
    const refreshToken = generateRefreshToken(user._id, role, sessionVersion);

    user.role = role;
    user.refreshToken = refreshToken;
    await user.save({ validateModifiedOnly: true });

    res.cookie("refreshToken", refreshToken, cookieOptions());

    return {
        accessToken,
        user: toPublicUser(user),
    };
};

const rotateSession = async (res, token) => {
    if (!token) {
        throw new ApiError(401, "No refresh token provided", "REFRESH_TOKEN_MISSING");
    }

    let decoded;
    try {
        decoded = verifyRefreshToken(token);
    } catch (error) {
        if (error instanceof ApiError) throw error;
        if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Refresh token expired — please login again", "REFRESH_TOKEN_EXPIRED");
        }
        throw new ApiError(401, "Invalid refresh token", "REFRESH_TOKEN_INVALID");
    }

    const user = await User.findById(decoded.id).select("+refreshToken +userType");
    if (!user || user.refreshToken !== token) {
        if (user) {
            user.refreshToken = null;
            await user.save({ validateModifiedOnly: true });
        }
        throw new ApiError(401, "Invalid refresh token — please login again", "TOKEN_REUSE_DETECTED");
    }

    assertAccountActive(user);
    assertSessionCurrent(user, decoded);
    const role = resolveRole(user);
    if (!role) {
        throw new ApiError(403, "Account role is not valid", "ROLE_INVALID");
    }
    if (decoded.role && decoded.role !== role && decoded.role !== "ADMIN") {
        throw new ApiError(401, "Session role is no longer valid — please login again", "ROLE_MISMATCH");
    }

    user.role = role;
    return issueSession(res, user);
};

const clearSession = async (userId, res) => {
    await User.updateOne(
        { _id: userId },
        { $inc: { sessionVersion: 1 }, $set: { refreshToken: null } }
    );
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
    });
};

module.exports = {
    registerSuperadmin,
    registerVendor,
    loginWithRole,
    loginWithUsername,
    issueSession,
    rotateSession,
    clearSession,
    assertAccountActive,
};
