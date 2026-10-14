const express = require("express");
const validate = require("../../middlewares/validate.middleware");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const { paymentLimiter } = require("../../middlewares/rateLimiter");
const { ROLES } = require("../../constants/roles");
const { verifyPaymentRules, failedPaymentRules } = require("./purchase.validator");
const { current, create, renew, verify, failed } = require("./purchase.controller");

const router = express.Router();

router.use(authenticate, authorize(ROLES.VENDOR));

router.get("/current", current);
router.post("/renew", paymentLimiter, renew);
router.post("/plans/:planId", paymentLimiter, create);
router.post("/:purchaseId/verify", paymentLimiter, verifyPaymentRules, validate, verify);
router.post("/:purchaseId/failed", paymentLimiter, failedPaymentRules, validate, failed);

module.exports = router;
