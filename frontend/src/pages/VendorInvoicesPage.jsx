import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardShell from "../components/DashboardShell";
import { useAuth } from "../context/AuthContext";
import { listInvoices } from "../api/invoices";
import { downloadInvoice } from "../lib/invoicePdf";
import { formatInr, formatWhen } from "../lib/money";
import { vendorNav } from "../lib/vendorNav";

function SkeletonInvoice() {
  return (
    <div className="border border-line bg-white px-5 py-5 sm:px-6 space-y-3">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-8 w-40" />
          <div className="skeleton h-3 w-32" />
        </div>
        <div className="space-y-2 text-right">
          <div className="skeleton h-3 w-16" />
          <div className="skeleton h-7 w-24" />
        </div>
      </div>
    </div>
  );
}

export default function VendorInvoicesPage() {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState("");

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    listInvoices(token)
      .then((result) => { if (active) setInvoices(result.data || []); })
      .catch((error) => { if (active) setBanner(error.message || "Could not load invoices"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  return (
    <DashboardShell eyebrow="Vendor" title="Invoices" nav={vendorNav}>
      <p className="max-w-xl text-sm leading-6 text-ink/60 animate-fade-up">
        Paid and declined payments are kept here, with the plan, order id, and the amount.
      </p>

      {banner ? (
        <div className="mt-5 flex items-start gap-3 border border-clay/25 bg-clay/7 px-4 py-3 text-sm text-clay">
          <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {banner}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((n) => <SkeletonInvoice key={n} />)}
        </div>
      ) : null}

      {!loading && !banner && invoices.length === 0 ? (
        <article className="mt-8 flex flex-col items-center border border-dashed border-line bg-white px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center" style={{ background: "rgba(184,137,58,0.08)", border: "1px solid rgba(184,137,58,0.2)" }}>
            <svg className="h-7 w-7 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <p className="mt-5 font-serif text-4xl text-ink/70">No invoices yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink/45">
            An invoice appears after a payment is received or declined.
          </p>
        </article>
      ) : null}

      <div className="mt-6 space-y-4 animate-fade-up" style={{ animationDelay: "80ms" }}>
        {invoices.map((invoice) => {
          const paid = invoice.status === "PAID";
          return (
            <article
              key={invoice.id}
              className="bg-white px-5 py-5 sm:px-6 card-hover"
              style={{
                border: "1px solid rgba(227,216,200,0.8)",
                boxShadow: "0 2px 8px rgba(16,14,12,0.05)",
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  {/* Invoice number + status badge */}
                  <div className="flex items-center gap-3">
                    <p className="text-[0.62rem] font-mono text-ink/40">{invoice.number}</p>
                    <span className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[0.58rem] font-semibold tracking-[0.18em] uppercase
                      ${paid ? "badge-active" : "badge-blocked"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${paid ? "bg-gold" : "bg-clay"}`} />
                      {paid ? "Paid" : "Declined"}
                    </span>
                  </div>
                  <h2 className="mt-2 font-serif text-3xl break-words text-ink">{invoice.planName}</h2>
                  <p className="mt-1.5 text-[0.68rem] break-all text-ink/40 font-mono">{invoice.orderId}</p>
                </div>
                <div className="sm:text-right">
                  <p className="font-serif text-3xl text-ink">{formatInr(invoice.amount)}</p>
                  <p className="mt-1 text-[0.68rem] text-ink/45">{formatWhen(invoice.paidAt || invoice.createdAt)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3" style={{ borderTop: "1px solid rgba(227,216,200,0.6)", paddingTop: "1rem" }}>
                <Link
                  to={`/vendor/invoices/${invoice.id}`}
                  className="btn-shine inline-flex items-center gap-2 px-4 py-2.5 text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-paper transition-all"
                  style={{ background: "linear-gradient(135deg, #161311, #3d342b)" }}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Open
                </Link>
                <button
                  type="button"
                  onClick={() => downloadInvoice(invoice)}
                  className="inline-flex items-center gap-2 border border-ink/25 px-4 py-2.5 text-[0.68rem] font-medium tracking-[0.16em] uppercase transition-all hover:border-gold hover:text-gold"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </DashboardShell>
  );
}
