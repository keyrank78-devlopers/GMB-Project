const asyncHandler = require("../../middlewares/asyncHandler");
const ApiError = require("../../utils/ApiError");
const { getBrand, setLogo, removeLogo, addPhoto, removePhoto } = require("./brand.service");

const show = asyncHandler(async (req, res) => {
    const brand = await getBrand();
    res.status(200).json({ success: true, data: brand });
});

const saveLogo = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "Choose an image", "IMAGE_REQUIRED");
    const brand = await setLogo(req.file.buffer);
    res.status(200).json({ success: true, message: "Company logo saved", data: brand });
});

const clearLogo = asyncHandler(async (req, res) => {
    const brand = await removeLogo();
    res.status(200).json({ success: true, message: "Company logo removed", data: brand });
});

const savePhoto = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "Choose an image", "IMAGE_REQUIRED");
    const brand = await addPhoto(req.file.buffer);
    res.status(200).json({ success: true, message: "Company photo saved", data: brand });
});

const clearPhoto = asyncHandler(async (req, res) => {
    const brand = await removePhoto(req.params.photoId);
    res.status(200).json({ success: true, message: "Company photo removed", data: brand });
});

module.exports = { show, saveLogo, clearLogo, savePhoto, clearPhoto };
