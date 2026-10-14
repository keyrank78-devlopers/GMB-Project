import { request } from "./client";

export function listInvoices(token) {
  return request("/vendor/invoices", { token });
}

export function getInvoice(token, invoiceId) {
  return request(`/vendor/invoices/${invoiceId}`, { token });
}
