# Google connect for vendors

A vendor links a Google account after a plan is `PAID`. This is not a way to sign in. Login stays username and password. A free plan, or no plan, cannot start the connection.

The Google client id and client secret stay in `Backend/.env`. The browser receives a Google address, never the secret. MongoDB stores `googleId` and `googleEmail` on the vendor. The Google id is not returned by the API. The public user includes `googleConnected` and, when linked, `googleEmail`.

## Google Cloud Console

Create an OAuth client of type **Web application**. Clear the `https://www.example.com` placeholders and enter these two values. Use `http`, keep the ports, and do not add a slash at the end.

| Field | Value |
| --- | --- |
| Authorized JavaScript origins | `http://localhost:5173` |
| Authorized redirect URIs | `http://localhost:5000/api/v1/vendor/oauth/google/callback` |

On the consent screen, keep the app in testing and add the Google account the vendor will use. The request asks only for profile and email.

After the client is created, copy the Client ID and Client secret into `Backend/.env`.

## Environment

In `Backend/.env`:

```
GOOGLE_CLIENT_ID=<client id from Google Cloud>
GOOGLE_CLIENT_SECRET=<client secret from Google Cloud>
FRONTEND_URL=http://localhost:5173
OAUTH_STATE_SECRET=<long random string you create yourself>
```

`OAUTH_STATE_SECRET` is not a Google value. It is a secret this server uses to sign the short-lived state token that carries the vendor id to Google and back. Any long random string is fine. Generate one once, paste it, and leave it. Do not type it into Google Cloud.

`FRONTEND_URL` is where the vendor returns after Google. `BACKEND_URL` is optional. When it is missing, the callback uses `http://localhost:5000`.

The API reads `.env` when the process starts. Saving the file does not update a server that is already running. Restart the backend after changing these values. Nodemon does not reload `.env` on its own.

If the process started while the Google values were still placeholders, **Connect Google** returns `503` and the toast says "Google OAuth is not configured on this server". The browser request `POST http://localhost:5173/api/v1/vendor/oauth/google/start-url` is the right address. Vite proxies `/api` to port 5000. Restart the API, then click **Connect Google** again.

## What the vendor sees

On the vendor desk:

- A paid plan shows **Connect Google**.
- After Google returns, the desk shows the linked email and **Disconnect**.
- A free plan, or no plan, shows a short note and a link to Plans. There is no connect button.

Success returns to `/vendor?oauth=success`. A refused or failed return uses `/vendor?oauth=error&reason=<code>`. The desk shows a toast and then removes the query from the address.

## Flow

1. The vendor is signed in. The desk calls `POST /api/v1/vendor/oauth/google/start-url` with the Bearer access token.
2. The server checks for a `PlanPurchase` with status `PAID`. A free `CHOSEN` plan does not pass.
3. The server signs a 10-minute state token with `OAUTH_STATE_SECRET`. The token contains the vendor id.
4. The response is `{ success: true, data: { url } }`. The browser goes to that Google address.
5. Google redirects to `GET /api/v1/vendor/oauth/google/callback`. This route has no JWT. The state token identifies the vendor.
6. The callback checks again that the account is an active vendor and that a paid plan still exists.
7. If that Google id is already stored on a different vendor, the link is refused.
8. The server saves `googleId` and `googleEmail`, then redirects to the vendor desk.

No Google access token or refresh token is stored.

## Routes

All paths are under `/api/v1`.

| Method | Path | Auth | What it does |
| --- | --- | --- | --- |
| POST | `/vendor/oauth/google/start-url` | Vendor Bearer token | Paid vendor only. Returns the Google address |
| GET | `/vendor/oauth/google/callback` | State token from Google | Links `googleId` and `googleEmail` |
| GET | `/vendor/oauth/google/status` | Vendor Bearer token | `{ googleConnected, googleEmail }` |
| DELETE | `/vendor/oauth/google/disconnect` | Vendor Bearer token | Removes the linked Google account |

A superadmin token cannot call the vendor routes.

## Stored fields

On the user document:

| Field | Rules |
| --- | --- |
| `googleId` | Unique, sparse. Not selected on normal reads. Not returned by the API. |
| `googleEmail` | Lowercase email from the Google profile. Returned when connected. |

`canConnectGoogle` on `GET /api/v1/vendor/desk` is true when this vendor has any purchase with status `PAID`.

## Errors

| Code | Status | When |
| --- | --- | --- |
| `PAYMENT_REQUIRED_FOR_OAUTH` | 403 | No purchase with status `PAID` |
| `OAUTH_NOT_CONFIGURED` | 503 | Google client id or secret was missing when the API process started |
| `OAUTH_STATE_INVALID` | 400 | State token is missing, expired, or signed with a different secret |
| `GOOGLE_ACCOUNT_TAKEN` | 409 | That Google account is already linked to another vendor |
| `GOOGLE_NOT_CONNECTED` | 400 | Disconnect was called with no linked account |
| `VENDOR_NOT_FOUND` | 403 | Vendor is missing, blocked, or not a vendor |
| `FORBIDDEN` | 403 | Caller is not a vendor |

## Folder layout

```
Backend/
  modules/vendor/google.strategy.js
  modules/vendor/google.oauth.controller.js
  modules/vendor/vendor.routes.js
  docs/OAUTH.md

frontend/src/
  api/oauth.js
  pages/VendorDashboard.jsx
```
