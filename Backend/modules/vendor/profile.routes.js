const express = require("express");
const validate = require("../../middlewares/validate.middleware");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const { ROLES } = require("../../constants/roles");
const { uploadLimiter } = require("../../middlewares/rateLimiter");
const { uploadImageFile } = require("../../middlewares/upload.middleware");
const { profileRules } = require("./profile.validator");
const { update, saveImage, removeImage } = require("./profile.controller");

const router = express.Router();

router.post("/image", authenticate, authorize(ROLES.VENDOR), uploadLimiter, uploadImageFile, saveImage);
router.delete("/image", authenticate, authorize(ROLES.VENDOR), removeImage);
router.patch("/", authenticate, authorize(ROLES.VENDOR), profileRules, validate, update);

module.exports = router;
