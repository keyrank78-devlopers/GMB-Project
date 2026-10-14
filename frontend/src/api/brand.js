import { request } from "./client";
import { sendFile } from "./upload";

export function getBrand() {
  return request("/brand");
}

export function uploadCompanyLogo(token, file) {
  return sendFile("/admin/brand/logo", token, { file });
}

export function removeCompanyLogo(token) {
  return sendFile("/admin/brand/logo", token, { method: "DELETE" });
}

export function uploadCompanyPhoto(token, file) {
  return sendFile("/admin/brand/photos", token, { file });
}

export function removeCompanyPhoto(token, photoId) {
  return sendFile(`/admin/brand/photos/${photoId}`, token, { method: "DELETE" });
}
