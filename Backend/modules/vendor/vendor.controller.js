const asyncHandler = require("../../middlewares/asyncHandler");
const { ROLES } = require("../../constants/roles");
const { toPublicUser } = require("../../utils/userResponse");
const { registerVendor, loginWithUsername, issueSession } = require("../auth/auth.service");

const register = asyncHandler(async (req, res) => {
    const vendor = await registerVendor(req.body);
    res.status(201).json({
        success: true,
        message: "Vendor created successfully",
        data: toPublicUser(vendor),
    });
});

const login = asyncHandler(async (req, res) => {
    const vendor = await loginWithUsername(req.body.username, req.body.password, ROLES.VENDOR);
    const session = await issueSession(res, vendor);
    res.status(200).json({
        success: true,
        message: "Vendor login successful",
        data: session,
    });
});

module.exports = { register, login };
