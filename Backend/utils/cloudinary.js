const cloudinary = require("cloudinary").v2;
const ApiError = require("./ApiError");

const PLACEHOLDERS = new Set([
    "YOUR_CLOUDINARY_CLOUD_NAME",
    "YOUR_CLOUDINARY_API_KEY",
    "YOUR_CLOUDINARY_API_SECRET",
]);

function credentials() {
    return {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
        apiKey: process.env.CLOUDINARY_API_KEY || "",
        apiSecret: process.env.CLOUDINARY_API_SECRET || "",
    };
}

function isConfigured() {
    const { cloudName, apiKey, apiSecret } = credentials();
    if (!cloudName || !apiKey || !apiSecret) return false;
    if (PLACEHOLDERS.has(cloudName) || PLACEHOLDERS.has(apiKey) || PLACEHOLDERS.has(apiSecret)) return false;
    return true;
}

function client() {
    if (!isConfigured()) {
        throw new ApiError(503, "Image storage is not configured on this server", "CLOUDINARY_NOT_CONFIGURED");
    }
    const { cloudName, apiKey, apiSecret } = credentials();
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
    });
    return cloudinary;
}

function uploadImage(buffer, publicId, folder = "keyrank/vendors") {
    const storage = client();
    return new Promise((resolve, reject) => {
        const stream = storage.uploader.upload_stream(
            {
                folder,
                public_id: String(publicId),
                overwrite: true,
                invalidate: true,
                resource_type: "image",
                unique_filename: false,
            },
            (error, result) => {
                if (error || !result?.secure_url || !result.public_id) {
                    reject(new ApiError(502, "The image could not be stored", "IMAGE_UPLOAD_FAILED"));
                    return;
                }
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            },
        );
        stream.end(buffer);
    });
}

async function destroyImage(publicId) {
    if (!publicId) return;
    const storage = client();
    const result = await storage.uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true,
    });
    if (result?.result !== "ok" && result?.result !== "not found") {
        throw new ApiError(502, "The stored image could not be removed", "IMAGE_DELETE_FAILED");
    }
}

module.exports = { isConfigured, uploadImage, destroyImage };
