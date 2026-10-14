const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 40 },
    nameKey: { type: String, required: true, unique: true, select: false },
    subtitle: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    price: { type: Number, required: true, min: 0 },
    durationDays: { type: Number, required: true, min: 1, max: 3650, default: 30 },
    features: {
        type: [{ type: String, trim: true, maxlength: 160 }],
        validate: {
            validator: (value) => Array.isArray(value) && value.length > 0 && value.length <= 30,
            message: "Add between 1 and 30 features",
        },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

planSchema.pre("validate", function setNameKey() {
    if (typeof this.name === "string") {
        this.nameKey = this.name.trim().toLowerCase();
    }
});

module.exports = mongoose.model("Plan", planSchema);
