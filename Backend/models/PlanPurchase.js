const mongoose = require("mongoose");

const planPurchaseSchema = new mongoose.Schema({
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
    planName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "INR" },
    razorpayOrderId: { type: String },
    startsAt: { type: Date },
    endsAt: { type: Date },
    status: {
        type: String,
        enum: ["AWAITING_PAYMENT", "CHOSEN", "PAID", "CANCELLED"],
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model("PlanPurchase", planPurchaseSchema);
