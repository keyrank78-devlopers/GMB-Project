const express = require("express");
const validate = require("../../middlewares/validate.middleware");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const { ROLES } = require("../../constants/roles");
const { vendorStatusRules, assignPlanRules } = require("./vendors.validator");
const { uploadLimiter } = require("../../middlewares/rateLimiter");
const { uploadImageFile } = require("../../middlewares/upload.middleware");
const { list, updateStatus, assign, saveLogo, clearLogo } = require("./vendors.controller");

const router = express.Router();

router.use(authenticate, authorize(ROLES.SUPERADMIN));
router.get("/", list);
router.patch("/:vendorId/status", vendorStatusRules, validate, updateStatus);
router.post("/:vendorId/plan", assignPlanRules, validate, assign);
router.post("/:vendorId/logo", uploadLimiter, uploadImageFile, saveLogo);
router.delete("/:vendorId/logo", clearLogo);

module.exports = router;
