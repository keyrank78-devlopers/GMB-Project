import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BrandMark from "./BrandMark";

function linkClass(isActive) {
  return `nav-link relative flex items-center gap-3 px-4 py-3 text-[0.72rem] font-medium tracking-[0.18em] uppercase transition-all duration-200 group
    ${isActive
      ? "nav-link-active text-gold"
      : "text-paper/60 hover:text-paper hover:bg-white/5 border-l-2 border-transparent"
    }`;
}

function NavIcon({ label }) {
  const icons = {
    Dashboard: (
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    Plans: (
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
    Invoices: (
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    Vendors: (
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    Payments: (
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    Brand: (
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    ),
    Profile: (
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  };

  return icons[label] || null;
}

export default function DashboardShell({ eyebrow, title, children, nav = [] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  async function onLogout() {
    setPending(true);
    try {
      await logout();
      navigate("/");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[288px_minmax(0,1fr)]">
      {/* ── Sidebar ── */}
      <aside
        className="bg-pine-deep text-paper lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto"
        style={{ borderRight: "1px solid rgba(184,137,58,0.12)" }}
      >
        {/* Header bar */}
        <div
          className="flex items-center justify-between gap-3 px-5 py-5 lg:px-7 lg:pt-8"
          style={{ borderBottom: "1px solid rgba(184,137,58,0.1)" }}
        >
          <BrandMark tone="dark" compact />
          <button
            type="button"
            onClick={() => setOpen((c) => !c)}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center border border-gold/30 text-gold/80 hover:text-gold hover:border-gold/60 transition-all duration-200 lg:hidden"
          >
            {open ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
                <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
                <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>

        {/* User info + nav */}
        <div
          className={`${open ? "block" : "hidden"} lg:flex lg:flex-1 lg:flex-col`}
          style={{ borderBottom: open ? "1px solid rgba(184,137,58,0.1)" : "none" }}
        >
          {/* User block */}
          <div className="px-5 py-6 lg:px-7" style={{ borderBottom: "1px solid rgba(184,137,58,0.08)" }}>
            <p
              className="text-[0.6rem] font-semibold tracking-[0.26em] uppercase"
              style={{ color: "rgba(184,137,58,0.7)" }}
            >
              {eyebrow}
            </p>
            <p className="mt-2 font-serif text-2xl leading-tight break-words text-paper">
              {user.name}
            </p>
            {user.companyName && (
              <p className="mt-0.5 text-[0.72rem] text-paper/50 tracking-wide">{user.companyName}</p>
            )}
            {user.email && (
              <p className="mt-0.5 text-[0.72rem] text-paper/40 break-all">{user.email}</p>
            )}

            {/* Status indicator */}
            <div className="mt-3 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
              </span>
              <span className="text-[0.6rem] tracking-[0.2em] text-gold/70 uppercase">Active Session</span>
            </div>
          </div>

          {/* Navigation */}
          {nav.length ? (
            <nav className="flex-1 py-3">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => linkClass(isActive)}
                >
                  <NavIcon label={item.label} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          ) : (
            <div className="flex-1" />
          )}

          {/* Bottom: logout */}
          <div className="p-4 lg:p-5" style={{ borderTop: "1px solid rgba(184,137,58,0.08)" }}>
            <button
              type="button"
              onClick={onLogout}
              disabled={pending}
              className="btn-shine group flex w-full items-center justify-center gap-2 border border-gold/30 px-4 py-2.5 text-[0.68rem] font-medium tracking-[0.18em] uppercase text-paper/70 transition-all duration-200 hover:border-gold/60 hover:text-gold disabled:opacity-60"
            >
              {pending ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing out…
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Log out
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="min-w-0 px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
        {/* Page header */}
        <header className="animate-fade-up mb-8">
          <div className="flex items-center gap-2">
            <span
              className="text-[0.62rem] font-semibold tracking-[0.32em] uppercase"
              style={{ color: "rgba(184,137,58,0.85)" }}
            >
              {eyebrow}
            </span>
            <span className="h-px flex-1 max-w-8" style={{ background: "rgba(184,137,58,0.3)" }} />
          </div>
          <h1 className="mt-2 font-serif text-4xl leading-tight break-words text-ink sm:text-5xl">
            {title}
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="h-0.5 w-12" style={{ background: "linear-gradient(90deg, #b8893a, transparent)" }} />
            <span className="h-px w-5" style={{ background: "rgba(184,137,58,0.3)" }} />
          </div>
        </header>

        <div className="animate-fade-in" style={{ animationDelay: "80ms" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
