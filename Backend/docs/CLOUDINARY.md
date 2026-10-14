# Image storage

Vendor images are stored in Cloudinary. The API keeps the secret. The browser sends the file to Keyrank, and Keyrank sends it to Cloudinary. The vendor document stores `imageUrl` and `imagePublicId`. The public id is not returned by the API.

Login, plans, payments, invoices, and Google connect are unchanged. A vendor with no image still uses the same profile form.

## What to add in Cloudinary

Create a free account at [cloudinary.com](https://cloudinary.com). Open the dashboard and copy these three values from the API environment panel:

- Cloud name
- API key
- API secret

Paste them into `Backend/.env`:

```
CLOUDINARY_CLOUD_NAME=<cloud name>
CLOUDINARY_API_KEY=<api key>
CLOUDINARY_API_SECRET=<api secret>
```

Restart the backend after saving. The process reads `.env` only when it starts. Until these values replace the placeholders, upload returns `503 CLOUDINARY_NOT_CONFIGURED`.

Images are stored in the Cloudinary folder `keyrank/vendors`. Replacing an image overwrites that vendor's file.

## What the vendor sees

On **Profile**, the company image block accepts JPG, PNG, or WEBP up to 5 MB. **Upload image** saves it. **Remove** deletes it from Cloudinary and from the vendor document. When an image is saved, the vendor desk shows it on the company card.

## Routes

| Method | Path | Auth | What it does |
| --- | --- | --- | --- |
| POST | `/api/v1/vendor/profile/image` | Vendor Bearer token | Multipart field name `image` |
| DELETE | `/api/v1/vendor/profile/image` | Vendor Bearer token | Removes the stored image |

The profile text update stays `PATCH /api/v1/vendor/profile` with JSON. Do not send the image on that route.

## Errors

| Code | Status | When |
| --- | --- | --- |
| `IMAGE_REQUIRED` | 400 | No file was sent |
| `IMAGE_TYPE_INVALID` | 400 | File is not JPG, PNG, or WEBP |
| `IMAGE_TOO_LARGE` | 400 | File is over 5 MB |
| `IMAGE_NOT_FOUND` | 400 | Remove was called with no saved image |
| `CLOUDINARY_NOT_CONFIGURED` | 503 | Cloud name, key, or secret is missing |
| `IMAGE_UPLOAD_FAILED` | 502 | Cloudinary rejected the upload |
| `IMAGE_DELETE_FAILED` | 502 | Cloudinary rejected the delete |
| `UPLOAD_RATE_LIMIT` | 429 | More than 20 uploads from one IP in 15 minutes |

## Folder layout

```
Backend/
  utils/cloudinary.js
  middlewares/upload.middleware.js
  modules/vendor/profile.service.js
  modules/vendor/profile.controller.js
  modules/vendor/profile.routes.js
  docs/CLOUDINARY.md

frontend/src/
  api/profile.js
  pages/VendorProfilePage.jsx
  pages/VendorDashboard.jsx
```
