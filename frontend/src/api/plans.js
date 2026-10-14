import { request } from "./client";

export function listPlans(token) {
  return request("/admin/plans", { token });
}

export function listCatalog(token) {
  return request("/plans", { token });
}

export function currentPurchase(token) {
  return request("/vendor/purchases/current", { token });
}

export function startPurchase(token, planId) {
  return request(`/vendor/purchases/plans/${planId}`, { method: "POST", token });
}

export function vendorDesk(token) {
  return request("/vendor/desk", { token });
}

export function renewPlan(token) {
  return request("/vendor/purchases/renew", { method: "POST", token });
}

export function verifyPurchase(token, purchaseId, payload) {
  return request(`/vendor/purchases/${purchaseId}/verify`, { method: "POST", token, body: payload });
}

export function reportPaymentFailure(token, purchaseId, payload) {
  return request(`/vendor/purchases/${purchaseId}/failed`, { method: "POST", token, body: payload });
}

export function createPlan(token, payload) {
  return request("/admin/plans", { method: "POST", token, body: payload });
}

export function updatePlan(token, id, payload) {
  return request(`/admin/plans/${id}`, { method: "PATCH", token, body: payload });
}

export function deletePlan(token, id) {
  return request(`/admin/plans/${id}`, { method: "DELETE", token });
}
