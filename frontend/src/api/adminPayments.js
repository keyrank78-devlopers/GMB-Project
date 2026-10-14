import { request } from "./client";

export function listAdminPayments(token) {
  return request("/admin/payments", { token });
}
