const express = require("express");
const adminRoutes = require("../modules/admin/admin.routes");
const vendorRoutes = require("../modules/vendor/vendor.routes");
const authRoutes = require("../modules/auth/auth.routes");
const planCatalogRoutes = require("../modules/plan/plan.catalog.routes");
const brandPublicRoutes = require("../modules/brand/brand.public.routes");

const router = express.Router();

router.use("/admin", adminRoutes);
router.use("/vendor", vendorRoutes);
router.use("/auth", authRoutes);
router.use("/plans", planCatalogRoutes);
router.use("/brand", brandPublicRoutes);

module.exports = router;
