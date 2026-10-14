import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardShell from "../components/DashboardShell";
import InvoiceSheet from "../components/InvoiceSheet";
import { useAuth } from "../context/AuthContext";
import { getInvoice } from "../api/invoices";
import { downloadInvoice } from "../lib/invoicePdf";
import { vendorNav } from "../lib/vendorNav";

export default function VendorInvoicePage() {
  const { invoiceId } = useParams();
  const { token } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState("");

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    getInvoice(token, invoiceId)
      .then((result) => {
        if (active) setInvoice(result.data);
      })
      .catch((error) => {
        if (active) setBanner(error.message || "Could not load this invoice");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, invoiceId]);

  return (
    <DashboardShell eyebrow="Vendor" title={invoice?.number || "Invoice"} nav={vendorNav}>
      <div className="mb-6 flex flex-wrap gap-3">
        <Link to="/vendor/invoices" className="border border-ink px-4 py-3 text-xs font-medium tracking-[0.16em] uppercase">
          All invoices
        </Link>
        {invoice ? (
          <button
            type="button"
            onClick={() => downloadInvoice(invoice)}
            className="bg-ink px-4 py-3 text-xs font-medium tracking-[0.16em] text-paper uppercase"
          >
            Download
          </button>
        ) : null}
      </div>

      {banner ? <div className="border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">{banner}</div> : null}
      {loading ? <p className="text-sm text-ink/60">Loading invoice…</p> : null}
      {invoice ? <InvoiceSheet invoice={invoice} /> : null}
    </DashboardShell>
  );
}