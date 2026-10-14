const asyncHandler = require("../../middlewares/asyncHandler");
const ApiError = require("../../utils/ApiError");
const { listVendors, setVendorStatus, assignVendorPlan, setVendorLogo, clearVendorLogo } = require("./vendors.service");

const list = asyncHandler(async (req, res) => {
    const directory = await listVendors(req.query.q);
    res.status(200).json({ success: true, data: directory });
});

const updateStatus = asyncHandler(async (req, res) => {
    const vendor = await setVendorStatus(req.params.vendorId, req.body.status);
    const message = vendor.status === "BLOCKED" ? "Vendor blocked" : "Vendor restored";
    res.status(200).json({ success: true, message, data: vendor });
});

const assign = asyncHandler(async (req, res) => {
    const directory = await assignVendorPlan(req.params.vendorId, req.body);
    res.status(200).json({ success: true, message: "Plan assigned", data: directory });
});

const saveLogo = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "Choose an image", "IMAGE_REQUIRED");
    const vendor = await setVendorLogo(req.params.vendorId, req.file.buffer);
    res.status(200).json({ success: true, message: "Vendor logo saved", data: vendor });
});

const clearLogo = asyncHandler(async (req, res) => {
    const vendor = await clearVendorLogo(req.params.vendorId);
    res.status(200).json({ success: true, message: "Vendor logo removed", data: vendor });
});

module.exports = { list, updateStatus, assign, saveLogo, clearLogo };
