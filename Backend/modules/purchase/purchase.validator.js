const { body } = require("express-validator");

const verifyPaymentRules = [
    body("razorpay_order_id").trim().notEmpty().withMessage("Razorpay order id is required"),
    body("razorpay_payment_id").trim().notEmpty().withMessage("Razorpay payment id is required"),
    body("razorpay_signature").trim().notEmpty().withMessage("Razorpay signature is required"),
];

const failedPaymentRules = [
    body("razorpay_order_id").optional({ values: "falsy" }).trim(),
    body("razorpay_payment_id").optional({ values: "falsy" }).trim(),
    body("code").optional({ values: "falsy" }).trim(),
    body("description").optional({ values: "falsy" }).trim(),
    body("source").optional({ values: "falsy" }).trim(),
    body("step").optional({ values: "falsy" }).trim(),
    body("reason").optional({ values: "falsy" }).trim(),
];

module.exports = { verifyPaymentRules, failedPaymentRules };
