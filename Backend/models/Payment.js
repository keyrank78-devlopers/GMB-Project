const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: "PlanPurchase", required: true, index: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
    planName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    amountPaise: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "INR" },
    razorpayOrderId: { type: String, required: true, index: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true },
    razorpaySignature: { type: String },
    razorpayStatus: { type: String },
    method: { type: String },
    email: { type: String },
    contact: { type: String },
    bank: { type: String },
    wallet: { type: String },
    vpa: { type: String },
    cardNetwork: { type: String },
    cardLast4: { type: String },
    errorCode: { type: String },
    errorDescription: { type: String },
    errorSource: { type: String },
    errorStep: { type: String },
    errorReason: { type: String },
    status: {
        type: String,
        enum: ["CREATED", "PAID", "FAILED"],
        required: true,
        default: "CREATED",
    },
    paidAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
