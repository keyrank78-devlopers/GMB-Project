const mongoose = require("mongoose");
const Brand = require("../../models/Brand");
const ApiError = require("../../utils/ApiError");
const { uploadImage, destroyImage } = require("../../utils/cloudinary");

const COMPANY_KEY = "company";
const COMPANY_FOLDER = "keyrank/company";
const MAX_PHOTOS = 8;

const toPublicBrand = (brand) => ({
    name: brand?.name || "Keyrank Solutions",
    tagline: brand?.tagline || "Digital Marketing",
    logoUrl: brand?.logoUrl || null,
    photos: (brand?.photos || []).map((photo) => ({
        id: photo._id,
        url: photo.url,
    })),
});

const ensureBrand = async () => {
    let brand = await Brand.findOne({ key: COMPANY_KEY });
    if (!brand) {
        brand = await Brand.create({
            key: COMPANY_KEY,
            name: "Keyrank Solutions",
            tagline: "Digital Marketing",
        });
    }
    return brand;
};

const getBrand = async () => toPublicBrand(await ensureBrand());

const setLogo = async (buffer) => {
    const brand = await ensureBrand();
    const previousId = brand.logoPublicId;
    const stored = await uploadImage(buffer, "logo", COMPANY_FOLDER);
    brand.logoUrl = stored.url;
    brand.logoPublicId = stored.publicId;
    await brand.save();
    if (previousId && previousId !== stored.publicId) await destroyImage(previousId);
    return toPublicBrand(brand);
};

const removeLogo = async () => {
    const brand = await ensureBrand();
    if (!brand.logoUrl && !brand.logoPublicId) {
        throw new ApiError(400, "No company logo is saved", "IMAGE_NOT_FOUND");
    }
    await destroyImage(brand.logoPublicId);
    brand.logoUrl = null;
    brand.logoPublicId = null;
    await brand.save();
    return toPublicBrand(brand);
};

const addPhoto = async (buffer) => {
    const brand = await ensureBrand();
    if (brand.photos.length >= MAX_PHOTOS) {
        throw new ApiError(400, `The company can keep ${MAX_PHOTOS} photos`, "PHOTO_LIMIT");
    }
    const photoId = new mongoose.Types.ObjectId();
    const stored = await uploadImage(buffer, `photo-${photoId}`, COMPANY_FOLDER);
    brand.photos.push({ _id: photoId, url: stored.url, publicId: stored.publicId });
    await brand.save();
    return toPublicBrand(brand);
};

const removePhoto = async (photoId) => {
    const brand = await ensureBrand();
    const photo = brand.photos.id(photoId);
    if (!photo) throw new ApiError(404, "Photo not found", "PHOTO_NOT_FOUND");
    await destroyImage(photo.publicId);
    brand.photos.pull({ _id: photo._id });
    await brand.save();
    return toPublicBrand(brand);
};

module.exports = { getBrand, setLogo, removeLogo, addPhoto, removePhoto };
