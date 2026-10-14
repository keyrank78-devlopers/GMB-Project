const multer = require("multer");
const ApiError = require("../utils/ApiError");

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_BYTES, files: 1 },
    fileFilter(req, file, callback) {
        if (!ALLOWED_TYPES.has(file.mimetype)) {
            callback(new ApiError(400, "Use a JPG, PNG, or WEBP image", "IMAGE_TYPE_INVALID"));
            return;
        }
        callback(null, true);
    },
});

module.exports = { uploadImageFile: upload.single("image") };
