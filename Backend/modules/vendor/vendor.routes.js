const express = require("express");
const { registerLimiter, loginLimiter } = require("../../middlewares/rateLimiter");
const validate = require("../../middlewares/validate.middleware");
const { vendorLoginRules, vendorRegisterRules } = require("./vendor.validator");
const { register, login } = require("./vendor.controller");
const purchaseRoutes = require("../purchase/purchase.routes");
const invoiceRoutes = require("../invoice/invoice.routes");
const profileRoutes = require("./profile.routes");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const { ROLES } = require("../../constants/roles");
const { desk } = require("../purchase/purchase.controller");
const {
    getGoogleOAuthUrl,
    googleOAuthCallback,
    disconnectGoogleOAuth,
    googleOAuthStatus,
} = require("./google.oauth.controller");


const router = express.Router();

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.post("/register", registerLimiter, vendorRegisterRules, validate, register);
router.post("/login", loginLimiter, vendorLoginRules, validate, login);

// ─── Desk ─────────────────────────────────────────────────────────────────────
router.get("/desk", authenticate, authorize(ROLES.VENDOR), desk);

// ─── Nested resource routes ───────────────────────────────────────────────────
router.use("/profile", profileRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/invoices", invoiceRoutes);

// ─── Google OAuth ─────────────────────────────────────────────────────────────
// POST /vendor/oauth/google/start-url    → JWT auth required; returns Google URL as JSON
// GET  /vendor/oauth/google/callback     → Google redirects here (no JWT; validated via state)
// GET  /vendor/oauth/google/status       → { googleConnected, googleEmail }
// DELETE /vendor/oauth/google/disconnect → remove linked Google account
router.post(
    "/oauth/google/start-url",
    authenticate,
    authorize(ROLES.VENDOR),
    getGoogleOAuthUrl,
);
router.get("/oauth/google/callback", googleOAuthCallback);
router.get(
    "/oauth/google/status",
    authenticate,
    authorize(ROLES.VENDOR),
    googleOAuthStatus,
);
router.delete(
    "/oauth/google/disconnect",
    authenticate,
    authorize(ROLES.VENDOR),
    disconnectGoogleOAuth,
);


module.exports = router;

