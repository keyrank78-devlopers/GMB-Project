const passport = require("passport");
const PlanPurchase = require("../../models/PlanPurchase");
const ApiError = require("../../utils/ApiError");
const asyncHandler = require("../../middlewares/asyncHandler");
const { buildStrategy, signState } = require("./google.strategy");

// ─── Register the strategy once (fails fast if .env is missing) ──────────────
try {
    passport.use("google-vendor", buildStrategy());
} catch (err) {
    // Warn but don't crash — routes will return 503 if Google creds are absent
    console.error("[OAuth] Google strategy not registered:", err.message);
}

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

// ─── Shared gate check ────────────────────────────────────────────────────────
async function assertPaidPlan(vendor) {
    const paidPurchase = await PlanPurchase.exists({ vendor: vendor._id, status: "PAID" });
    if (!paidPurchase) {
        throw new ApiError(
            403,
            "You need an active paid plan before connecting a Google account",
            "PAYMENT_REQUIRED_FOR_OAUTH",
        );
    }
    if (!passport._strategies["google-vendor"]) {
        throw new ApiError(503, "Google OAuth is not configured on this server", "OAUTH_NOT_CONFIGURED");
    }
}

/**
 * POST /api/v1/vendor/oauth/google/start-url
 * Returns the Google OAuth URL as JSON so the frontend can navigate to it.
 * This lets the vendor JWT be sent as a Bearer header (normal fetch call).
 */
const getGoogleOAuthUrl = asyncHandler(async (req, res) => {
    const vendor = req.user;
    await assertPaidPlan(vendor);

    const state = signState(vendor._id);
    const scope = encodeURIComponent("profile email");
    const redirectUri = encodeURIComponent(`${BACKEND_URL}/api/v1/vendor/oauth/google/callback`);
    const clientId = encodeURIComponent(process.env.GOOGLE_CLIENT_ID);

    const url =
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${clientId}` +
        `&redirect_uri=${redirectUri}` +
        `&response_type=code` +
        `&scope=${scope}` +
        `&state=${encodeURIComponent(state)}` +
        `&prompt=select_account`;

    return res.status(200).json({ success: true, data: { url } });
});

/**
 * GET /api/v1/vendor/oauth/google/callback
 * Google redirects here after the vendor grants (or denies) permission.
 */
const googleOAuthCallback = (req, res, next) => {
    passport.authenticate("google-vendor", {
        session: false,
        failureRedirect: `${FRONTEND_URL}/vendor?oauth=error&reason=google_failed`,
    }, (err, vendor) => {
        if (err) {
            const code = err.code || "OAUTH_FAILED";
            const status = err.statusCode || 500;
            if (status < 500) {
                return res.redirect(
                    `${FRONTEND_URL}/vendor?oauth=error&reason=${encodeURIComponent(code)}`,
                );
            }
            return next(err);
        }
        if (!vendor) {
            return res.redirect(`${FRONTEND_URL}/vendor?oauth=error&reason=google_failed`);
        }
        return res.redirect(`${FRONTEND_URL}/vendor?oauth=success`);
    })(req, res, next);
};

/**
 * DELETE /api/v1/vendor/oauth/google/disconnect
 * Removes linked Google account from this vendor.
 */
const disconnectGoogleOAuth = asyncHandler(async (req, res) => {
    const vendor = req.user;
    if (!vendor.googleEmail) {
        throw new ApiError(400, "No Google account is connected to this vendor", "GOOGLE_NOT_CONNECTED");
    }
    await vendor.constructor.findByIdAndUpdate(vendor._id, {
        $unset: { googleId: 1, googleEmail: 1 },
    });
    return res.status(200).json({
        success: true,
        message: "Google account disconnected successfully",
    });
});

/**
 * GET /api/v1/vendor/oauth/google/status
 * Returns whether the authenticated vendor has a Google account linked.
 */
const googleOAuthStatus = asyncHandler(async (req, res) => {
    const vendor = req.user;
    return res.status(200).json({
        success: true,
        data: {
            googleConnected: Boolean(vendor.googleEmail),
            googleEmail: vendor.googleEmail || null,
        },
    });
});

module.exports = {
    getGoogleOAuthUrl,
    googleOAuthCallback,
    disconnectGoogleOAuth,
    googleOAuthStatus,
};

