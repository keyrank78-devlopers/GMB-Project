export function formatInr(amount) {
  const value = Number(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function formatWhen(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function paymentMethod(invoice) {
  if (invoice.cardLast4) return [invoice.cardNetwork, `•••• ${invoice.cardLast4}`].filter(Boolean).join(" ");
  if (invoice.vpa) return `UPI ${invoice.vpa}`;
  if (invoice.bank) return invoice.bank;
  if (invoice.wallet) return invoice.wallet;
  if (invoice.method) return invoice.method;
  return "";
}
