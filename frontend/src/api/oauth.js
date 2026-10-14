/**
 * oauth.js — frontend API helpers for Google OAuth.
 *
 * Why POST /start-url instead of direct browser GET?
 * The backend needs to verify the vendor's JWT (Bearer token) before
 * redirecting to Google. Fetch can send the token as a header; a browser
 * navigation (window.location) cannot. So we:
 *   1. POST  /vendor/oauth/google/start-url  (with Bearer token) → get { url }
 *   2. window.location.href = url            → browser goes to Google
 */
import { request } from "./client";

/**
 * Get the Google OAuth URL from the backend, then navigate to it.
 * Backend applies the payment gate before returning the URL.
 * @param {string} token - vendor JWT access token
 */
export async function connectGoogle(token) {
  const data = await request("/vendor/oauth/google/start-url", {
    method: "POST",
    token,
  });
  if (data?.data?.url) {
    window.location.href = data.data.url;
  }
}

/**
 * Disconnect the vendor's linked Google account.
 * @param {string} token - vendor JWT access token
 */
export function disconnectGoogle(token) {
  return request("/vendor/oauth/google/disconnect", {
    method: "DELETE",
    token,
  });
}

/**
 * Fetch current Google connection status for the authenticated vendor.
 * @param {string} token - vendor JWT access token
 */
export function googleOAuthStatus(token) {
  return request("/vendor/oauth/google/status", { token });
}

