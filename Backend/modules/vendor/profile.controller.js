const asyncHandler = require("../../middlewares/asyncHandler");
const ApiError = require("../../utils/ApiError");
const { toPublicUser } = require("../../utils/userResponse");
const { issueSession } = require("../auth/auth.service");
const { updateVendorProfile, setVendorImage, removeVendorImage } = require("./profile.service");

const update = asyncHandler(async (req, res) => {
    const { vendor, passwordChanged } = await updateVendorProfile(req.user._id, req.body);
    if (passwordChanged) {
        const session = await issueSession(res, vendor);
        return res.status(200).json({
            success: true,
            message: "Profile updated",
            data: session.user,
            accessToken: session.accessToken,
        });
    }

    res.status(200).json({
        success: true,
        message: "Profile updated",
        data: toPublicUser(vendor),
    });
});

const saveImage = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "Choose an image", "IMAGE_REQUIRED");
    const vendor = await setVendorImage(req.user._id, req.file.buffer);
    res.status(200).json({
        success: true,
        message: "Image saved",
        data: toPublicUser(vendor),
    });
});

const removeImage = asyncHandler(async (req, res) => {
    const vendor = await removeVendorImage(req.user._id);
    res.status(200).json({
        success: true,
        message: "Image removed",
        data: toPublicUser(vendor),
    });
});

module.exports = { update, saveImage, removeImage };
