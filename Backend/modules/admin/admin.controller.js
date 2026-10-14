const asyncHandler = require("../../middlewares/asyncHandler");
const { ROLES } = require("../../constants/roles");
const { toPublicUser } = require("../../utils/userResponse");
const { registerSuperadmin, loginWithRole, issueSession } = require("../auth/auth.service");

const register = asyncHandler(async (req, res) => {
    const admin = await registerSuperadmin(req.body);
    res.status(201).json({
        success: true,
        message: "Superadmin created successfully",
        data: toPublicUser(admin),
    });
});

const login = asyncHandler(async (req, res) => {
    const admin = await loginWithRole(req.body.email, req.body.password, ROLES.SUPERADMIN);
    const session = await issueSession(res, admin);
    res.status(200).json({
        success: true,
        message: "Superadmin login successful",
        data: session,
    });
});

module.exports = { register, login };
