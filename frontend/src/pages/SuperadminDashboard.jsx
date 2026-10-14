import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardShell from "../components/DashboardShell";
import { useAuth } from "../context/AuthContext";
import { listAdminPayments } from "../api/adminPayments";
import { listVendors } from "../api/vendors";
import { adminNav } from "../lib/adminNav";
import { formatInr } from "../lib/money";

function Detail({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[0.65rem] font-medium tracking-[0.16em] uppercase text-ink/40">{label}</dt>
      <dd className="mt-1.5 text-sm font-medium text-ink/80">{value}</dd>
    </div>
  );
}

function StatCard({ href, label, value, sub, loading, icon, dark }) {
  const content = (
    <article
      className={`relative overflow-hidden px-5 py-6 card-hover ${dark ? "text-paper" : "border border-line bg-white text-ink"}`}
      style={dark ? {
        background: "linear-gradient(135deg, #100e0c 0%, #1e1a16 50%, #2a2118 100%)",
        border: "1px solid rgba(184,137,58,0.25)",
        boxShadow: "0 4px 24px rgba(16,14,12,0.25), inset 0 1px 0 rgba(184,137,58,0.1)",
      } : {
        boxShadow: "0 2px 12px rgba(16,14,12,0.05)",
      }}
    >
      {/* Glow for dark card */}
      {dark && (
        <div
          className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(184,137,58,0.15) 0%, transparent 70%)" }}
        />
      )}

      {/* Left accent bar */}
      {!dark && (
        <div
          className="absolute inset-y-0 left-0 w-0.5"
          style={{ background: "linear-gradient(180deg, #b8893a, rgba(184,137,58,0.1))" }}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[0.6rem] font-semibold tracking-[0.28em] uppercase"
            style={{ color: dark ? "rgba(184,137,58,0.7)" : "#b8893a" }}>
            {label}
          </p>
          <p className={`mt-3 font-serif text-5xl break-words ${dark ? "text-paper" : "text-ink"}`}>
            {loading ? (
              <span className="inline-block w-12 skeleton h-10" />
            ) : value}
          </p>
          {sub && (
            <p className={`mt-2 text-xs leading-5 ${dark ? "text-paper/55" : "text-ink/55"}`}>{sub}</p>
          )}
        </div>
        {icon && (
          <div
            className="shrink-0 flex h-10 w-10 items-center justify-center"
            style={{
              background: dark ? "rgba(184,137,58,0.12)" : "rgba(184,137,58,0.08)",
              border: "1px solid rgba(184,137,58,0.2)",
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </article>
  );

  if (href) {
    return (
      <Link to={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

export default function SuperadminDashboard() {
  const { user, token } = useAuth();
  const [vendorCount, setVendorCount] = useState(null);
  const [expiringCount, setExpiringCount] = useState(null);
  const [received, setReceived] = useState(null);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    Promise.all([listVendors(token), listAdminPayments(token)])
      .then(([vendors, payments]) => {
        if (!active) return;
        setVendorCount(vendors.data?.count ?? 0);
        setExpiringCount(vendors.data?.expiringCount ?? 0);
        setReceived(payments.data?.received ?? 0);
      })
      .catch(() => {
        if (!active) return;
        setVendorCount(null);
        setExpiringCount(null);
        setReceived(null);
      });
    return () => { active = false; };
  }, [token]);

  const loading = vendorCount === null && expiringCount === null && received === null;

  return (
    <DashboardShell eyebrow="Superadmin" title="Admin Desk" nav={adminNav}>
      {/* ── Stat grid ── */}
      <section className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-fade-up">
        {/* Admin identity */}
        <StatCard
          dark
          label="Signed in as"
          value={user.name}
          sub={user.email}
          loading={false}
          icon={
            <svg className="h-5 w-5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
        />

        {/* Vendors */}
        <StatCard
          href="/admin/vendors"
          label="Vendors"
          value={vendorCount === null ? "—" : String(vendorCount)}
          sub="Open the full list and their plans"
          loading={loading}
          icon={
            <svg className="h-5 w-5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />

        {/* Revenue */}
        <StatCard
          href="/admin/payments"
          label="Revenue"
          value={received === null ? "—" : formatInr(received)}
          sub="Paid Razorpay orders"
          loading={loading}
          icon={
            <svg className="h-5 w-5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          }
        />

        {/* Expiring soon */}
        <StatCard
          href="/admin/vendors"
          label="Ending Soon"
          value={expiringCount === null ? "—" : String(expiringCount)}
          sub="Plans ending within 7 days"
          loading={loading}
          icon={
            <svg className="h-5 w-5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />

        {/* Access notice */}
        <article
          className="border border-line bg-white px-6 py-5 sm:col-span-2 xl:col-span-4"
          style={{ boxShadow: "0 2px 8px rgba(16,14,12,0.04)" }}
        >
          <div className="flex items-start gap-4">
            <div
              className="shrink-0 flex h-10 w-10 items-center justify-center mt-0.5"
              style={{ background: "rgba(184,137,58,0.08)", border: "1px solid rgba(184,137,58,0.18)" }}
            >
              <svg className="h-5 w-5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <p className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-ink/50">Access Control</p>
              <p className="mt-1.5 text-sm leading-6 text-ink/65">
                This desk is only for the superadmin. A vendor who opens this address is automatically redirected to the vendor desk.
              </p>
            </div>
          </div>
        </article>
      </section>

      {/* ── Account section ── */}
      <section
        className="mt-5 bg-white animate-fade-up"
        style={{
          border: "1px solid rgba(227,216,200,0.8)",
          boxShadow: "0 2px 12px rgba(16,14,12,0.05)",
          animationDelay: "120ms",
        }}
      >
        <div
          className="flex items-center gap-3 px-6 py-5"
          style={{ borderBottom: "1px solid rgba(227,216,200,0.6)" }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center"
            style={{ background: "rgba(184,137,58,0.1)", border: "1px solid rgba(184,137,58,0.2)" }}
          >
            <svg className="h-4 w-4" fill="none" stroke="#b8893a" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl text-ink">Account Details</h2>
        </div>
        <dl className="grid gap-6 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Name" value={user.name} />
          <Detail label="Username" value={user.username} />
          <Detail label="Phone" value={user.phone} />
          <Detail label="Email" value={user.email} />
          <Detail label="Status" value={user.status} />
        </dl>
      </section>
    </DashboardShell>
  );
}
