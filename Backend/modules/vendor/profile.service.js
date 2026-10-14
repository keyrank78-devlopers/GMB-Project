const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const { sessionVersionOf } = require("../../utils/session");
const { uploadImage, destroyImage } = require("../../utils/cloudinary");

const updateVendorProfile = async (vendorId, { name, phone, companyName, currentPassword, newPassword }) => {
    const vendor = await User.findById(vendorId).select("+password");
    if (!vendor) throw new ApiError(404, "Vendor not found", "VENDOR_NOT_FOUND");

    const nextPhone = String(phone).trim();
    if (nextPhone !== vendor.phone) {
        const taken = await User.findOne({ phone: nextPhone, _id: { $ne: vendorId } }).select("_id");
        if (taken) throw new ApiError(409, "This phone number is already in use", "PHONE_IN_USE");
    }

    vendor.name = String(name).trim();
    vendor.phone = nextPhone;
    vendor.companyName = String(companyName).trim();

    let passwordChanged = false;
    if (newPassword) {
        if (!currentPassword) {
            throw new ApiError(400, "Enter your current password", "PASSWORD_REQUIRED");
        }
        const matches = await vendor.matchPassword(currentPassword);
        if (!matches) {
            throw new ApiError(400, "Current password is incorrect", "PASSWORD_INCORRECT");
        }
        vendor.password = newPassword;
        vendor.sessionVersion = sessionVersionOf(vendor) + 1;
        passwordChanged = true;
    }

    await vendor.save();
    return { vendor, passwordChanged };
};

const setVendorImage = async (vendorId, buffer) => {
    const vendor = await User.findById(vendorId).select("+imagePublicId");
    if (!vendor) throw new ApiError(404, "Vendor not found", "VENDOR_NOT_FOUND");

    const stored = await uploadImage(buffer, String(vendorId));
    const previousId = vendor.imagePublicId;
    vendor.imageUrl = stored.url;
    vendor.imagePublicId = stored.publicId;
    await vendor.save();

    if (previousId && previousId !== stored.publicId) {
        await destroyImage(previousId);
    }
    return vendor;
};

const removeVendorImage = async (vendorId) => {
    const vendor = await User.findById(vendorId).select("+imagePublicId");
    if (!vendor) throw new ApiError(404, "Vendor not found", "VENDOR_NOT_FOUND");
    if (!vendor.imageUrl && !vendor.imagePublicId) {
        throw new ApiError(400, "No image is saved for this vendor", "IMAGE_NOT_FOUND");
    }

    await destroyImage(vendor.imagePublicId);
    const updated = await User.findByIdAndUpdate(
        vendorId,
        { $unset: { imageUrl: 1, imagePublicId: 1 } },
        { new: true },
    );
    return updated;
};

module.exports = { updateVendorProfile, setVendorImage, removeVendorImage };
