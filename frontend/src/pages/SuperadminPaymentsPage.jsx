import { useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import { useAuth } from "../context/AuthContext";
import { listAdminPayments } from "../api/adminPayments";
import { adminNav } from "../lib/adminNav";
import { formatInr, formatWhen } from "../lib/money";

function SkeletonCard() {
  return (
    <div className="border border-line bg-white px-5 py-5 sm:px-6 space-y-3">
      <div className="skeleton h-3 w-16" />
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-4 w-36" />
    </div>
  );
}

export default function SuperadminPaymentsPage() {
  const { token } = useAuth();
  const [report, setReport] = useState({ received: 0, paidCount: 0, declinedCount: 0, payments: [] });
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState("");

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    listAdminPayments(token)
      .then((result) => {
        if (active) setReport(result.data || { received: 0, paidCount: 0, declinedCount: 0, payments: [] });
      })
      .catch((error) => {
        if (active) setBanner(error.message || "Could not load payments");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token]);

  return (
    <DashboardShell eyebrow="Superadmin" title="Payments" nav={adminNav}>
      <p className="max-w-xl text-sm leading-6 text-ink/60 animate-fade-up">
        Money received through Razorpay, and the payments that were declined.
      </p>

      {/* Summary stats */}
      <div className="mt-6 stagger grid gap-4 sm:grid-cols-3 animate-fade-up" style={{ animationDelay: "40ms" }}>
        {/* Revenue */}
        <article
          className="relative overflow-hidden px-5 py-6 text-paper"
          style={{
            background: "linear-gradient(135deg, #100e0c 0%, #1e1a16 50%, #2a2118 100%)",
            border: "1px solid rgba(184,137,58,0.25)",
            boxShadow: "0 4px 24px rgba(16,14,12,0.25), inset 0 1px 0 rgba(184,137,58,0.1)",
          }}
        >
          <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full" style={{ background: "radial-gradient(circle, rgba(184,137,58,0.15) 0%, transparent 70%)" }} />
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[0.6rem] font-semibold tracking-[0.28em] uppercase" style={{ color: "rgba(184,137,58,0.7)" }}>Revenue</p>
              <p className="mt-3 font-serif text-4xl text-paper">
                {loading ? <span className="skeleton inline-block w-24 h-9" /> : formatInr(report.received)}
              </p>
            </div>
            <div className="shrink-0 flex h-10 w-10 items-center justify-center mt-1" style={{ background: "rgba(184,137,58,0.12)", border: "1px solid rgba(184,137,58,0.2)" }}>
              <svg className="h-5 w-5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
          </div>
        </article>

        {/* Paid */}
        <article
          className="relative overflow-hidden border border-line bg-white px-5 py-6 card-hover"
          style={{ boxShadow: "0 2px 12px rgba(16,14,12,0.05)" }}
        >
          <div className="absolute inset-y-0 left-0 w-0.5" style={{ background: "linear-gradient(180deg, #b8893a, rgba(184,137,58,0.1))" }} />
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[0.6rem] font-semibold tracking-[0.28em] uppercase" style={{ color: "#b8893a" }}>Paid</p>
              <p className="mt-3 font-serif text-5xl text-ink">
                {loading ? <span className="skeleton inline-block w-16 h-10" /> : report.paidCount}
              </p>
              <p className="mt-1 text-xs text-ink/45">Successful payments</p>
            </div>
            <div className="shrink-0 flex h-10 w-10 items-center justify-center mt-1" style={{ background: "rgba(184,137,58,0.08)", border: "1px solid rgba(184,137,58,0.2)" }}>
              <svg className="h-5 w-5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </article>

        {/* Declined */}
        <article
          className="relative overflow-hidden border border-line bg-white px-5 py-6 card-hover"
          style={{ boxShadow: "0 2px 12px rgba(16,14,12,0.05)" }}
        >
          <div className="absolute inset-y-0 left-0 w-0.5" style={{ background: "linear-gradient(180deg, #9b3a2f, rgba(155,58,47,0.1))" }} />
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[0.6rem] font-semibold tracking-[0.28em] uppercase text-clay">Declined</p>
              <p className="mt-3 font-serif text-5xl text-ink">
                {loading ? <span className="skeleton inline-block w-16 h-10" /> : report.declinedCount}
              </p>
              <p className="mt-1 text-xs text-ink/45">Failed payments</p>
            </div>
            <div className="shrink-0 flex h-10 w-10 items-center justify-center mt-1" style={{ background: "rgba(155,58,47,0.07)", border: "1px solid rgba(155,58,47,0.18)" }}>
              <svg className="h-5 w-5 text-clay" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" strokeLinecap="round" />
                <line x1="9" y1="9" x2="15" y2="15" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </article>
      </div>

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
          {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
        </div>
      ) : null}

      {!loading && !banner && report.payments.length === 0 ? (
        <article className="mt-8 flex flex-col items-center border border-dashed border-line bg-white px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center" style={{ background: "rgba(184,137,58,0.08)", border: "1px solid rgba(184,137,58,0.2)" }}>
            <svg className="h-7 w-7 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
          <p className="mt-5 font-serif text-4xl text-ink/70">No payments yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink/45">
            A row appears when a vendor payment is received or declined.
          </p>
        </article>
      ) : null}

      <div className="mt-6 space-y-4 animate-fade-up" style={{ animationDelay: "100ms" }}>
        {report.payments.map((payment) => {
          const paid = payment.status === "PAID";
          return (
            <article
              key={payment.id}
              className="bg-white px-5 py-5 sm:px-6 card-hover"
              style={{
                border: "1px solid rgba(227,216,200,0.8)",
                boxShadow: "0 2px 8px rgba(16,14,12,0.05)",
              }}
            >
              {/* Top accent */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[0.6rem] font-semibold tracking-[0.18em] uppercase
                    ${paid ? "badge-active" : "badge-blocked"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${paid ? "bg-gold" : "bg-clay"}`} />
                    {paid ? "Paid" : "Declined"}
                  </span>
                  <h2 className="mt-3 font-serif text-3xl break-words text-ink">{payment.vendorName || "Vendor"}</h2>
                  <p className="mt-1 text-sm text-ink/55">{payment.companyName} · {payment.planName}</p>
                  <p className="mt-1.5 text-[0.68rem] break-all text-ink/40 font-mono">{payment.orderId}</p>
                  {payment.paymentId ? <p className="text-[0.68rem] break-all text-ink/40 font-mono">{payment.paymentId}</p> : null}
                  {payment.note ? <p className="mt-2 text-sm text-clay">{payment.note}</p> : null}
                </div>
                <div className="sm:text-right">
                  <p className="font-serif text-3xl text-ink">{formatInr(payment.amount)}</p>
                  <p className="mt-1 text-[0.68rem] text-ink/45">{formatWhen(payment.paidAt || payment.createdAt)}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </DashboardShell>
  );
}
