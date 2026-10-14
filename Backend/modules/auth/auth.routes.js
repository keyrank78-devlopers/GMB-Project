const express = require("express");
const { refreshLimiter, registerLimiter, loginLimiter } = require("../../middlewares/rateLimiter");
const validate = require("../../middlewares/validate.middleware");
const { authenticate } = require("../../middlewares/auth.middleware");
const { loginRules } = require("./auth.validator");
const { adminRegisterRules } = require("../admin/admin.validator");
const { refreshToken, logout, getMe } = require("./auth.controller");
const { register: registerSuperadmin, login: loginSuperadmin } = require("../admin/admin.controller");

const router = express.Router();

router.post("/refresh-token", refreshLimiter, refreshToken);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);

// Previous Postman paths. New clients should use /api/v1/admin and /api/v1/vendor.
router.post("/admin/register", registerLimiter, adminRegisterRules, validate, registerSuperadmin);
router.post("/login", loginLimiter, loginRules, validate, loginSuperadmin);

module.exports = router;
