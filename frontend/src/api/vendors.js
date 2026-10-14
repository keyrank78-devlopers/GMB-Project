import { request } from "./client";
import { sendFile } from "./upload";

export function listVendors(token, query = "") {
  const search = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
  return request(`/admin/vendors${search}`, { token });
}

export function updateVendorStatus(token, vendorId, status) {
  return request(`/admin/vendors/${vendorId}/status`, { method: "PATCH", token, body: { status } });
}

export function assignVendorPlan(token, vendorId, body) {
  return request(`/admin/vendors/${vendorId}/plan`, { method: "POST", token, body });
}

export function uploadVendorLogo(token, vendorId, file) {
  return sendFile(`/admin/vendors/${vendorId}/logo`, token, { file });
}

export function removeVendorLogo(token, vendorId) {
  return sendFile(`/admin/vendors/${vendorId}/logo`, token, { method: "DELETE" });
}
