const express = require("express");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const { ROLES } = require("../../constants/roles");
const { uploadLimiter } = require("../../middlewares/rateLimiter");
const { uploadImageFile } = require("../../middlewares/upload.middleware");
const { saveLogo, clearLogo, savePhoto, clearPhoto } = require("./brand.controller");

const router = express.Router();

router.use(authenticate, authorize(ROLES.SUPERADMIN));
router.post("/logo", uploadLimiter, uploadImageFile, saveLogo);
router.delete("/logo", clearLogo);
router.post("/photos", uploadLimiter, uploadImageFile, savePhoto);
router.delete("/photos/:photoId", clearPhoto);

module.exports = router;
