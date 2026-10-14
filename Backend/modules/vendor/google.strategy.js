/**
 * google.strategy.js
 * Stateless Google OAuth strategy for passport-google-oauth20.
 *
 * FLOW:
 *   1. Vendor calls GET /api/v1/vendor/oauth/google/start
 *      → server checks they have a PAID plan
 *      → signs a short-lived "state" JWT that encodes { vendorId }
 *      → passport redirects to Google with that state param
 *   2. Google redirects back to /api/v1/vendor/oauth/google/callback?code=…&state=…
 *      → strategy verifies state JWT to recover vendorId (no express-session needed)
 *      → links (or updates) googleId + googleEmail on the User document
 *      → redirects browser to the frontend with a success flag
 */
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const PlanPurchase = require("../../models/PlanPurchase");
const ApiError = require("../../utils/ApiError");
const { ROLES, resolveRole } = require("../../constants/roles");

/**
 * Sign a short-lived state token that carries the vendor's id.
 * We embed it in the OAuth state param so we can recover it in the callback
 * without any server-side session.
 */
function signState(vendorId) {
    if (!process.env.OAUTH_STATE_SECRET) {
        throw new ApiError(500, "OAuth state secret is not configured", "OAUTH_STATE_SECRET_MISSING");
    }
    return jwt.sign({ vendorId: String(vendorId) }, process.env.OAUTH_STATE_SECRET, { expiresIn: "10m" });
}

/**
 * Verify and decode the state param.  Returns { vendorId } or throws.
 */
function verifyState(state) {
    if (!process.env.OAUTH_STATE_SECRET) {
        throw new ApiError(500, "OAuth state secret is not configured", "OAUTH_STATE_SECRET_MISSING");
    }
    try {
        return jwt.verify(state, process.env.OAUTH_STATE_SECRET);
    } catch {
        throw new ApiError(400, "OAuth state is invalid or expired — please try again", "OAUTH_STATE_INVALID");
    }
}

function buildStrategy() {
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID_HERE") {
        throw new Error("GOOGLE_CLIENT_ID is not set in .env");
    }
    if (!process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET === "YOUR_GOOGLE_CLIENT_SECRET_HERE") {
        throw new Error("GOOGLE_CLIENT_SECRET is not set in .env");
    }

    return new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/v1/vendor/oauth/google/callback`,
            passReqToCallback: true,   // lets us read req.query.state in the verify fn
        },
        async (req, _accessToken, _refreshToken, profile, done) => {
            try {
                // 1. Recover vendorId from the state JWT we signed before the redirect
                const state = req.query.state;
                const { vendorId } = verifyState(state);

                // 2. Find the vendor — they must still exist and be active
                const vendor = await User.findById(vendorId).select("+googleId");
                if (!vendor || vendor.status !== "ACTIVE" || resolveRole(vendor) !== ROLES.VENDOR) {
                    return done(new ApiError(403, "Vendor account not found or blocked", "VENDOR_NOT_FOUND"));
                }

                const paid = await PlanPurchase.exists({ vendor: vendor._id, status: "PAID" });
                if (!paid) {
                    return done(new ApiError(403, "You need an active paid plan before connecting a Google account", "PAYMENT_REQUIRED_FOR_OAUTH"));
                }

                const googleId = profile.id;
                const googleEmail = (profile.emails?.[0]?.value || "").toLowerCase();

                // 3. Make sure this Google account isn't linked to a *different* vendor
                const conflict = await User.findOne({ googleId, _id: { $ne: vendor._id } });
                if (conflict) {
                    return done(new ApiError(409, "This Google account is already linked to another vendor", "GOOGLE_ACCOUNT_TAKEN"));
                }

                // 4. Link (or update) the Google account on this vendor
                vendor.googleId = googleId;
                vendor.googleEmail = googleEmail;
                await vendor.save();

                return done(null, vendor);
            } catch (err) {
                return done(err);
            }
        },
    );
}

module.exports = { buildStrategy, signState, verifyState };
