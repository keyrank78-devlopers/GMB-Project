const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema({
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
}, { _id: true });

const brandSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, default: "company" },
    name: { type: String, required: true, trim: true, default: "Keyrank Solutions" },
    tagline: { type: String, required: true, trim: true, default: "Digital Marketing" },
    logoUrl: { type: String, trim: true },
    logoPublicId: { type: String, trim: true },
    photos: { type: [photoSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model("Brand", brandSchema);
