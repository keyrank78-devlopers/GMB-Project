const express = require("express");
const { registerLimiter, loginLimiter } = require("../../middlewares/rateLimiter");
const validate = require("../../middlewares/validate.middleware");
const { loginRules } = require("../auth/auth.validator");
const { adminRegisterRules } = require("./admin.validator");
const { register, login } = require("./admin.controller");
const planRoutes = require("../plan/plan.routes");
const vendorDirectoryRoutes = require("./vendors.routes");
const paymentReportRoutes = require("./payments.routes");
const brandRoutes = require("../brand/brand.routes");

const router = express.Router();

router.post("/register", registerLimiter, adminRegisterRules, validate, register);
router.post("/login", loginLimiter, loginRules, validate, login);
router.use("/plans", planRoutes);
router.use("/vendors", vendorDirectoryRoutes);
router.use("/payments", paymentReportRoutes);
router.use("/brand", brandRoutes);

module.exports = router;
