# Plans

Superadmin creates the plans that the product can sell later. Nothing about a plan is fixed in code. Free, Basic, Premium, and Gold are examples the superadmin can type in. They can add more names whenever they want.

The superadmin creates and edits plans on the admin desk. Vendors only read them, on the Plans page in their navbar.

## Stored shape

Collection: `plans`

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | 2–40 characters. Shown as typed. |
| `nameKey` | string | Lowercase copy of `name`. Unique, so `Premium` and `premium` count as the same plan. Not returned by the API. |
| `subtitle` | string | 2–120 characters. Short line under the name. |
| `price` | number | `0` or greater. `0` is a free plan. Stored with up to 2 decimal places. |
| `durationDays` | number | 1–3650. How long a chosen or paid plan lasts. Existing plans without this field are treated as 30 days. |
| `features` | string[] | 1–30 items. Each item is 1–160 characters. |
| `createdBy` | ObjectId | Superadmin who created the plan. Not returned by the API. |
| `createdAt`, `updatedAt` | dates | Set by MongoDB. |

## Folder layout

```
Backend/
  models/Plan.js
  modules/plan/plan.validator.js
  modules/plan/plan.service.js
  modules/plan/plan.controller.js
  modules/plan/plan.routes.js          superadmin CRUD at /admin/plans
  modules/plan/plan.catalog.routes.js  read-only list at /plans
  modules/admin/admin.routes.js        mounts the CRUD routes
  docs/PLANS.md

frontend/src/
  api/plans.js
  components/PlansManager.jsx
  pages/SuperadminDashboard.jsx    renders PlansManager
  pages/VendorPlansPage.jsx        catalog the vendor sees
  lib/vendorNav.js                 Desk and Plans links
```

`plan.routes.js` sits under `/api/v1/admin/plans`. Every request there runs `authenticate` and `authorize(SUPERADMIN)` before the handler.

Validation failures become `400 VALIDATION_ERROR` with an `errors` array. Missing plans become `404 PLAN_NOT_FOUND`. A repeated name becomes `409 DUPLICATE_PLAN`. A vendor token on the admin routes becomes `403 FORBIDDEN`. A missing token becomes `401 TOKEN_MISSING`. Vendors may call the read-only catalog.

## Routes

Header: `Authorization: Bearer <superadmin access token>` and `Content-Type: application/json`.

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/api/v1/plans` | Catalog for a signed-in superadmin or vendor. Cheapest first. |
| GET | `/api/v1/admin/plans` | Same list, superadmin only |
| POST | `/api/v1/admin/plans` | Create a plan |
| GET | `/api/v1/admin/plans/:id` | Read one plan |
| PATCH | `/api/v1/admin/plans/:id` | Replace name, subtitle, price, and features |
| DELETE | `/api/v1/admin/plans/:id` | Delete a plan |

### Create

`POST /api/v1/admin/plans`

```json
{
  "name": "Premium",
  "subtitle": "For growing shops",
  "price": 999,
  "features": [
    "Up to 10 locations",
    "Priority support"
  ]
}
```

Success is `201`. `data` is the saved plan:

```json
{
  "id": "<id>",
  "name": "Premium",
  "subtitle": "For growing shops",
  "price": 999,
  "features": ["Up to 10 locations", "Priority support"],
  "createdAt": "<date>",
  "updatedAt": "<date>"
}
```

Update uses the same body on `PATCH /api/v1/admin/plans/:id`. Send the full plan, not a single changed field. Delete returns `{ "success": true, "message": "Plan deleted" }`.

## Admin desk

After a superadmin signs in, the sidebar links to the desk, **Plans**, **Vendors**, and **Payments**. The desk shows the vendor count, money received, and how many plans end within 7 days. Vendors can be searched by name, company, phone, or plan. **Block** ends that vendor's session. **Restore** lets them sign in again. **Set plan** replaces the vendor's current plan and can take a start and end date; empty dates use the plan length. `GET /api/v1/admin/payments` lists paid and declined Razorpay payments and the received total. A vendor token on these routes is `403 FORBIDDEN`. The plans page lists plans and a form. The form adds feature rows one at a time. Edit loads that plan back into the form. Delete asks for a second click before the plan is removed.

The sign-in page does not show this form. A vendor who opens `/admin` is sent back to the vendor desk.

## Vendor page

After a vendor signs in, the sidebar has **Desk**, **Plans**, **Invoice**, and **Profile**. The desk shows the active plan, its amount, the end date, and a link to that plan's latest paid invoice. **Renew** opens Razorpay for a paid plan and adds the new period after the current end date. A free plan renews without checkout. **Profile** updates name, phone, and company name, and can change the password. Plans opens `/vendor/plans` and lists every plan the superadmin has saved. Vendors cannot create, edit, or delete a plan from that page. A successful payment and a declined payment each show a toast. **Invoice** opens `/vendor/invoices`.

Each card has **Choose** when the price is `0`, and **Buy now** when the price is greater than `0`.

`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` live in `Backend/.env`. The secret never goes to the browser. **Buy now** loads Razorpay Checkout. The plan stays unpaid until the server accepts the signature.

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/api/v1/vendor/purchases/current` | Latest open choice, or the latest paid plan. `paidPlanIds` lists every paid plan |
| POST | `/api/v1/vendor/purchases/plans/:planId` | Choose a free plan, or create a Razorpay order for a paid plan |
| POST | `/api/v1/vendor/purchases/:purchaseId/verify` | Check `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`, then mark the plan paid |
| POST | `/api/v1/vendor/purchases/:purchaseId/failed` | Store a failed checkout |

The paid checkout response includes `checkout.keyId`, `checkout.orderId`, `checkout.amount` (paise), and `checkout.currency`. After a successful payment, the signature and the Razorpay payment fields are stored in the `payments` collection. The signature is not sent back to the browser. The plan choice in `planpurchases` becomes `PAID` only after the signature matches and Razorpay reports the payment as captured or authorized. A bad signature is `400 PAYMENT_SIGNATURE_INVALID` and is stored as a failed payment. Choosing another unpaid plan cancels the previous open choice. A paid record stays. A superadmin token on these routes is `403 FORBIDDEN`. Paid plans must cost at least ₹1.

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/api/v1/vendor/invoices` | Paid and declined invoices for the signed-in vendor |
| GET | `/api/v1/vendor/invoices/:invoiceId` | One invoice: name, company, plan, amount, order id, payment id, method, and date |

Verify and the failed-payment route also return `invoiceId` when a record was saved. The vendor can open that invoice and download it as a PDF.
