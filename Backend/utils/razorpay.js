const crypto = require("crypto");
const Razorpay = require("razorpay");
const ApiError = require("./ApiError");

const credentials = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
        throw new ApiError(500, "Razorpay is not configured", "RAZORPAY_NOT_CONFIGURED");
    }
    return { keyId, keySecret };
};

const razorpayClient = () => {
    const { keyId, keySecret } = credentials();
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const signaturesMatch = (expected, received) => {
    const left = Buffer.from(String(expected));
    const right = Buffer.from(String(received || ""));
    if (left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
};

const verifyPaymentSignature = (orderId, paymentId, signature) => {
    const { keySecret } = credentials();
    const expected = crypto
        .createHmac("sha256", keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
    return signaturesMatch(expected, signature);
};

const razorpayMessage = (error) => {
    return error?.error?.description || error?.message || "Razorpay request failed";
};

module.exports = {
    credentials,
    razorpayClient,
    verifyPaymentSignature,
    razorpayMessage,
};
