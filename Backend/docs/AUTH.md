# Auth setup

This file records the review of the previous auth code and the role-based setup that replaced it.

## What the old code did

The API only knew one account type. `User.userType` was locked to `ADMIN`.

- `POST /api/v1/auth/admin/register` created an admin when `admin_secret` matched `ADMIN_CREATION_SECRET`.
- `POST /api/v1/auth/login` signed in only users with `userType: "ADMIN"`.
- Refresh, logout, and `GET /api/v1/auth/me` were shared and did not carry a role.
- MongoDB connection stayed in `config/db.js`. A failed connection exits the process, which is why nodemon showed "app crashed" when Atlas credentials were wrong.

## Problems that would block the next features

- There was no vendor account, and login could not tell roles apart.
- The access token stored only the user id, so later routes could not authorize from the token.
- Validation, auth, and database errors were returned from different places. Some responses had a `code`, most did not.
- `allowedOrigins` was read from `.env` and then ignored. CORS allowed every origin.
- Controllers, routes, and validators sat in flat folders. Adding vendor, and later orders or products, would pile more unrelated code into the same files.
- `crypto.timingSafeEqual` throws when the two secrets have different lengths, so the admin-secret check fell back to a length leak.
- Accounts already saved as `userType: "ADMIN"` would fail a strict `SUPERADMIN` schema on the next save.

## What this change adds

Two roles:

| Role | Who | How they are created |
| --- | --- | --- |
| `SUPERADMIN` | The admin / superadmin | Register with name, username, phone, password, and email. Login with email and password. |
| `VENDOR` | A vendor | Public self-registration |

The role is chosen by the server. A client cannot send `role` and become a superadmin.

Existing admin documents that only have `userType: "ADMIN"` still log in on the superadmin route. The first successful login writes `role: "SUPERADMIN"` onto that document.

## Folder layout

```
Backend/
  app.js                      Express app, security, route mount
  server.js                   Process start and shutdown
  config/db.js                MongoDB connection
  constants/roles.js          Role names and legacy ADMIN mapping
  docs/AUTH.md                This file
  middlewares/
    asyncHandler.js           Sends rejected promises to the error handler
    auth.middleware.js        authenticate + authorize(roles)
    error.middleware.js       404 and one JSON error shape
    rateLimiter.js            Login, register, and refresh limits
    validate.middleware.js    express-validator failures
  models/User.js              Shared account collection
  modules/
    admin/                    Superadmin register and login
    vendor/                   Vendor register and login
    auth/                     Shared session: refresh, logout, current user
  routes/index.js             Mounts /admin, /vendor, and /auth
  utils/
    ApiError.js
    token.js
    userResponse.js           Fields safe to return to the client
```

New features should follow the same module shape: `modules/<feature>/<feature>.routes.js`, controller, and validator. Protect a route with `authenticate` and `authorize(ROLES.SUPERADMIN)` or `authorize(ROLES.VENDOR)`.

## Routes

Base URL in development: `http://localhost:5000`

| Method | Path | Who |
| --- | --- | --- |
| POST | `/api/v1/admin/register` | Create a superadmin |
| POST | `/api/v1/admin/login` | Superadmin login |
| POST | `/api/v1/vendor/register` | Create a vendor |
| POST | `/api/v1/vendor/login` | Vendor login |
| POST | `/api/v1/auth/refresh-token` | Either role, cookie required |
| POST | `/api/v1/auth/logout` | Either role, Bearer token required |
| GET | `/api/v1/auth/me` | Either role, Bearer token required |
| GET | `/api/v1/health` | No auth |

The old paths still work and call the superadmin handlers:

- `POST /api/v1/auth/admin/register`
- `POST /api/v1/auth/login`

A vendor token cannot call a route guarded with `authorize(ROLES.SUPERADMIN)`, and a superadmin cannot sign in on `/api/v1/vendor/login`.

## Request bodies

Header for every JSON call: `Content-Type: application/json`

### Superadmin register

`POST /api/v1/admin/register`

```json
{
  "name": "Admin",
  "username": "admin",
  "phone": "+919876543210",
  "password": "admin123",
  "email": "admin@example.com"
}
```

Success is `201` with `data.role` equal to `SUPERADMIN`. This route does not return a token. Call login next.

### Superadmin login

`POST /api/v1/admin/login`

```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

### Vendor register

`POST /api/v1/vendor/register`

```json
{
  "name": "Ravi Kumar",
  "phone": "9876543211",
  "username": "ravi",
  "password": "vendor123",
  "companyName": "Ravi Traders"
}
```

### Vendor login

`POST /api/v1/vendor/login`

```json
{
  "username": "ravi",
  "password": "vendor123"
}
```

## Session

Login returns:

```json
{
  "success": true,
  "message": "Superadmin login successful",
  "data": {
    "accessToken": "<jwt>",
    "user": {
      "id": "<id>",
      "role": "SUPERADMIN",
      "name": "Admin",
      "email": "admin@example.com",
      "phone": "+919876543210",
      "username": "admin",
      "status": "ACTIVE"
    }
  }
}
```

The access token payload is `{ id, role }`. Send it as `Authorization: Bearer <accessToken>`.

The refresh token is an httpOnly cookie named `refreshToken`. Postman must keep cookies enabled for refresh and logout. Logout also needs the Bearer access token.

Password and refresh token are not selected on normal reads and are never returned by the API.

## Error shape

Every failed request uses the same JSON:

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    { "field": "email", "message": "Provide a valid email" }
  ]
}
```

`errors` is present only for validation failures.

| Code | Status | When |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Body failed the route rules |
| `INVALID_JSON` | 400 | Body is not JSON |
| `INVALID_CREDENTIALS` | 401 | Email or password is wrong |
| `TOKEN_MISSING` | 401 | Bearer token was not sent |
| `TOKEN_INVALID` | 401 | Bearer token cannot be verified |
| `TOKEN_EXPIRED` | 401 | Access token expired |
| `REFRESH_TOKEN_MISSING` | 401 | Refresh cookie was not sent |
| `REFRESH_TOKEN_INVALID` | 401 | Refresh cookie is not a valid token |
| `REFRESH_TOKEN_EXPIRED` | 401 | Refresh cookie expired |
| `TOKEN_REUSE_DETECTED` | 401 | Refresh cookie does not match the saved token |
| `ROLE_MISMATCH` | 403 | Account used the other role's login |
| `ACCOUNT_BLOCKED` | 403 | Status is `BLOCKED` |
| `ACCOUNT_INACTIVE` | 403 | Status is `INACTIVE` |
| `FORBIDDEN` | 403 | `authorize` rejected the role |
| `DUPLICATE_ACCOUNT` | 409 | Email, phone, or username is already registered |
| `ROUTE_NOT_FOUND` | 404 | Path is not registered |
| `CORS_FORBIDDEN` | 403 | Browser origin is not in `ALLOWED_ORIGINS` |
| `INTERNAL_ERROR` | 500 | Unexpected failure. Production hides the message |

Register is limited to 5 attempts per IP per hour. Login is limited to 10 attempts per IP per 15 minutes.

## Environment

Required in `Backend/.env`:

- `MONGOURL`
- `PORT`
- `NODE_ENV`
- `ALLOWED_ORIGINS` (comma-separated, no spaces)
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_EXPIRY`
- `REFRESH_TOKEN_EXPIRY`

## Google account for vendors

A vendor connects Google only after a plan is `PAID`. Setup, routes, and the `503` that appears before the API is restarted are written in [OAUTH.md](./OAUTH.md).
