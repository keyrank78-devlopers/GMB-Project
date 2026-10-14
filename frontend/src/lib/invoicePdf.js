import { formatWhen, paymentMethod } from "./money.js";

function pdfText(value) {
  return String(value ?? "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function inr(amount) {
  const value = Number(amount);
  const digits = value % 1 === 0 ? 0 : 2;
  return `INR ${value.toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

function draw(text, x, y, size, font = "F1") {
  return `BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${pdfText(text)}) Tj ET\n`;
}

function buildPdf(stream) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>",
  ];
  let cursor = "%PDF-1.4\n".length;
  const offsets = [0];
  const body = objects.map((object, index) => {
    offsets.push(cursor);
    const chunk = `${index + 1} 0 obj\n${object}\nendobj\n`;
    cursor += chunk.length;
    return chunk;
  }).join("");
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) {
    xref += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  return `%PDF-1.4\n${body}${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${cursor}\n%%EOF`;
}

export function invoicePdfBytes(invoice) {
  const paid = invoice.status === "PAID";
  const method = paymentMethod(invoice);
  const rows = [
    ["Billed to", invoice.vendorName],
    ["Company", invoice.companyName],
    ["Phone", invoice.phone],
    ["Email", invoice.email],
    ["Plan", invoice.planName],
    ["Order id", invoice.orderId],
    ["Payment id", invoice.paymentId],
    ["Method", method],
    ["Date", formatWhen(invoice.paidAt || invoice.createdAt)],
  ].filter(([, value]) => value);

  let stream = "0.063 0.086 0.110 rg\n0 760 595 82 re f\n";
  stream += "0.722 0.537 0.227 rg\n";
  stream += draw("KEYRANK SOLUTIONS", 48, 800, 11, "F2");
  stream += "1 1 1 rg\n";
  stream += draw(paid ? "Invoice" : "Payment receipt", 48, 776, 28, "F2");
  stream += draw(invoice.number, 400, 792, 16, "F2");
  stream += draw(paid ? "Paid" : "Declined", 400, 772, 12, "F1");

  let y = 700;
  stream += "0.063 0.055 0.047 rg\n";
  rows.forEach(([label, value]) => {
    stream += "0.722 0.537 0.227 rg\n";
    stream += draw(label.toUpperCase(), 48, y, 9, "F2");
    stream += "0.086 0.075 0.067 rg\n";
    stream += draw(value, 190, y, 12, "F1");
    y -= 28;
  });

  if (invoice.note) {
    y -= 8;
    stream += "0.549 0.227 0.196 rg\n";
    stream += draw(invoice.note, 48, y, 11, "F1");
    y -= 36;
  }

  stream += "0.890 0.847 0.784 RG\n1 w\n48 " + (y - 4) + " m 547 " + (y - 4) + " l S\n";
  y -= 42;
  stream += "0.722 0.537 0.227 rg\n";
  stream += draw("AMOUNT", 48, y, 9, "F2");
  stream += "0.086 0.075 0.067 rg\n";
  stream += draw(inr(invoice.amount), 190, y - 6, 22, "F2");
  stream += draw("Keyrank Solutions  ·  This document is your copy of the payment.", 48, 48, 10, "F1");
  return buildPdf(stream);
}

export function downloadInvoice(invoice) {
  const bytes = invoicePdfBytes(invoice);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Keyrank-Solutions-${invoice.number}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
