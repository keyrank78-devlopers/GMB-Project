import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import DashboardShell from "../components/DashboardShell";
import Toast from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { renewPlan, reportPaymentFailure, vendorDesk, verifyPurchase } from "../api/plans";
import { openRazorpayCheckout } from "../lib/razorpayCheckout";
import { formatInr, formatWhen } from "../lib/money";
import { vendorNav } from "../lib/vendorNav";
import { connectGoogle, disconnectGoogle } from "../api/oauth";


function Detail({ label, value }) {
  if (!value) return null;
  return (
    <div className="group">
      <dt className="text-[0.65rem] font-medium tracking-[0.16em] uppercase text-ink/40">{label}</dt>
      <dd className="mt-1.5 text-sm font-medium text-ink/80">{value}</dd>
    </div>
  );
}

function planNote(plan) {
  if (!plan?.endsAt) return "";
  if (plan.expired) return "Expired";
  if (plan.expiring) return "Ending soon";
  return "Active";
}

function planNoteColor(plan) {
  if (!plan?.endsAt) return "text-ink/50";
  if (plan.expired) return "text-clay";
  if (plan.expiring) return "text-amber-600";
  return "text-emerald-700";
}

function SkeletonPlan() {
  return (
    <div className="space-y-3 mt-3">
      <div className="skeleton h-8 w-40" />
      <div className="skeleton h-4 w-24" />
      <div className="skeleton h-10 w-32 mt-2" />
    </div>
  );
}

export default function VendorDashboard() {
  const { token, user, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [desk, setDesk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);
  const [oauthPending, setOauthPending] = useState(false);
  const [toast, setToast] = useState(null);
  const dismissToast = useCallback(() => setToast(null), []);

  // ── Handle ?oauth=success/error returned by the backend callback ──────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthResult = params.get("oauth");
    if (!oauthResult) return;

    // Clean the query param from the URL without a page reload
    navigate("/vendor", { replace: true });

    if (oauthResult === "success") {
      setToast({
        tone: "success",
        title: "Google Connected",
        message: "Your Google account has been linked successfully.",
      });
    } else {
      const reason = params.get("reason") || "google_failed";
      const messages = {
        PAYMENT_REQUIRED_FOR_OAUTH: "You need a paid plan before connecting Google.",
        GOOGLE_ACCOUNT_TAKEN: "That Google account is already linked to another vendor.",
        OAUTH_NOT_CONFIGURED: "Google OAuth is not set up on this server yet.",
        OAUTH_STATE_INVALID: "The OAuth session expired. Please try again.",
        google_failed: "Google connection failed. Please try again.",
      };
      setToast({
        tone: "error",
        title: "Google Connection Failed",
        message: messages[reason] || "Something went wrong. Please try again.",
      });
    }
  }, [location.search, navigate]);


  const loadDesk = useCallback(() => {
    if (!token) return Promise.resolve();
    return vendorDesk(token)
      .then((result) => setDesk(result.data || { plan: null, invoiceId: null }))
      .catch(() => setDesk({ plan: null, invoiceId: null }));
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    vendorDesk(token)
      .then((result) => {
        if (active) setDesk(result.data || { plan: null, invoiceId: null });
      })
      .catch(() => {
        if (active) setDesk({ plan: null, invoiceId: null });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token]);

  async function onConnectGoogle() {
    setOauthPending(true);
    setToast(null);
    try {
      await connectGoogle(token);
    } catch (error) {
      setToast({
        tone: "error",
        title: "Google connection failed",
        message: error.message || "Could not start Google connection",
      });
      setOauthPending(false);
    }
  }

  async function onDisconnectGoogle() {
    setOauthPending(true);
    setToast(null);
    try {
      await disconnectGoogle(token);
      await refreshUser();
      setToast({
        tone: "success",
        title: "Google disconnected",
        message: "This account is no longer linked to Google.",
      });
    } catch (error) {
      setToast({
        tone: "error",
        title: "Could not disconnect Google",
        message: error.message || "Try again in a moment.",
      });
    } finally {
      setOauthPending(false);
    }
  }

  async function onRenew() {
    setRenewing(true);
    setToast(null);
    try {
      const data = await renewPlan(token);
      if (!data.data?.checkout) {
        await loadDesk();
        setToast({ tone: "success", title: "Plan renewed", message: data.message });
        return;
      }
      await openRazorpayCheckout({
        checkout: data.data.checkout,
        user,
        onSuccess: async (response) => {
          const verified = await verifyPurchase(token, data.data.id, response);
          await loadDesk();
          setToast({
            tone: "success",
            title: "Plan renewed",
            message: `${verified.data.planName} is paid.`,
            href: verified.invoiceId ? `/vendor/invoices/${verified.invoiceId}` : "/vendor/invoices",
          });
        },
        onFailure: async (failure) => {
          try { await reportPaymentFailure(token, data.data.id, failure); } catch {}
          setToast({
            tone: "error",
            title: "Renewal declined",
            message: failure.description || "The payment was not completed.",
          });
        },
      });
    } catch (error) {
      setToast({
        tone: "error",
        title: "Renewal declined",
        message: error.message || "Could not renew this plan",
      });
    } finally {
      setRenewing(false);
    }
  }

  const plan = desk?.plan;
  const amount = plan ? (Number(plan.amount) ? formatInr(plan.amount) : "Free") : "";

  return (
    <DashboardShell eyebrow="Vendor" title={user.companyName || "Vendor Desk"} nav={vendorNav}>
      <Toast toast={toast} onClose={dismissToast} />

      {/* ── Top stat cards ── */}
      <section className="stagger grid gap-4 sm:grid-cols-3 animate-fade-up">
        {/* Company card */}
        <article
          className="relative overflow-hidden px-5 py-6 text-paper"
          style={{
            background: "linear-gradient(135deg, #100e0c 0%, #1e1a16 50%, #2a2118 100%)",
            border: "1px solid rgba(184,137,58,0.25)",
            boxShadow: "0 4px 24px rgba(16,14,12,0.25), inset 0 1px 0 rgba(184,137,58,0.1)",
          }}
        >
          {/* Gold corner accent */}
          <div className="absolute top-0 right-0 h-16 w-16 overflow-hidden">
            <div
              className="absolute top-0 right-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(184,137,58,0.15) 0%, transparent 70%)" }}
            />
          </div>
          <p className="text-[0.6rem] font-semibold tracking-[0.28em] uppercase" style={{ color: "rgba(184,137,58,0.7)" }}>
            Company
          </p>
          {user.imageUrl ? (
            <img src={user.imageUrl} alt="" className="mt-4 h-14 w-14 object-cover" />
          ) : null}
          <p className="mt-3 font-serif text-3xl leading-tight break-words">{user.companyName || user.name}</p>
          <p className="mt-2 text-[0.72rem] text-paper/50">@{user.username}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="h-px flex-1" style={{ background: "rgba(184,137,58,0.2)" }} />
            <span className="text-[0.58rem] tracking-[0.2em] text-paper/30 uppercase">Vendor</span>
          </div>
        </article>

        {/* Current plan card */}
        <article
          className="border border-line bg-white px-5 py-6 sm:col-span-2 card-hover relative overflow-hidden"
          style={{ boxShadow: "0 2px 12px rgba(16,14,12,0.06)" }}
        >
          <div
            className="absolute inset-y-0 left-0 w-0.5"
            style={{ background: "linear-gradient(180deg, #b8893a, rgba(184,137,58,0.2))" }}
          />
          <p className="text-[0.6rem] font-semibold tracking-[0.28em] uppercase" style={{ color: "#b8893a" }}>
            Current Plan
          </p>

          {loading ? <SkeletonPlan /> : null}

          {!loading && !plan ? (
            <div className="mt-3">
              <p className="font-serif text-3xl text-ink/60">No plan yet</p>
              <p className="mt-2 text-sm text-ink/45">Subscribe to a plan to get started.</p>
              <Link
                to="/vendor/plans"
                className="btn-shine mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-[0.68rem] font-semibold tracking-[0.18em] uppercase text-paper transition-all"
                style={{ background: "linear-gradient(135deg, #161311, #3d342b)" }}
              >
                Browse Plans
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          ) : null}

          {!loading && plan ? (
            <div className="mt-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <p className="font-serif text-4xl break-words text-ink">{plan.planName}</p>
                <p className="font-serif text-3xl" style={{ color: "#b8893a" }}>{amount}</p>
              </div>
              <p className={`mt-2 text-[0.72rem] font-medium tracking-[0.1em] ${planNoteColor(plan)}`}>
                {planNote(plan)}
                {plan.endsAt ? ` · Ends ${formatWhen(plan.endsAt)}` : ""}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {desk.invoiceId ? (
                  <Link
                    to={`/vendor/invoices/${desk.invoiceId}`}
                    className="btn-shine inline-flex items-center gap-2 px-4 py-2.5 text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-paper transition-all"
                    style={{ background: "linear-gradient(135deg, #161311, #3d342b)" }}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                    View Invoice
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={onRenew}
                  disabled={renewing}
                  className="inline-flex items-center gap-2 border border-ink/30 px-4 py-2.5 text-[0.68rem] font-semibold tracking-[0.16em] uppercase transition-all hover:border-gold hover:text-gold disabled:opacity-60"
                >
                  {renewing ? (
                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                  )}
                  {renewing ? "Please wait…" : "Renew Plan"}
                </button>
              </div>
            </div>
          ) : null}
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
          className="flex flex-wrap items-center justify-between gap-3 px-6 py-5"
          style={{ borderBottom: "1px solid rgba(227,216,200,0.6)" }}
        >
          <div className="flex items-center gap-3">
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
          <Link
            to="/vendor/profile"
            className="flex items-center gap-1.5 text-[0.68rem] font-medium tracking-[0.16em] uppercase transition-colors hover:text-gold"
            style={{ color: "#b8893a" }}
          >
            Edit Profile
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Link>
        </div>
        <dl className="grid gap-6 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Name" value={user.name} />
          <Detail label="Username" value={user.username ? `@${user.username}` : null} />
          <Detail label="Phone" value={user.phone} />
          <Detail label="Status" value={user.status} />
        </dl>
      </section>

      <section
        className="mt-5 bg-white px-6 py-6"
        style={{
          border: "1px solid rgba(227,216,200,0.8)",
          boxShadow: "0 2px 12px rgba(16,14,12,0.05)",
        }}
      >
        <p className="text-[0.6rem] font-semibold tracking-[0.28em] uppercase" style={{ color: "#b8893a" }}>
          Google account
        </p>
        {user.googleConnected ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-serif text-3xl break-all text-ink">{user.googleEmail}</p>
              <p className="mt-2 text-sm text-ink/55">Connected after payment.</p>
            </div>
            <button
              type="button"
              onClick={onDisconnectGoogle}
              disabled={oauthPending}
              className="border border-ink/30 px-4 py-2.5 text-[0.68rem] font-semibold tracking-[0.16em] uppercase disabled:opacity-60"
            >
              {oauthPending ? "Please wait…" : "Disconnect"}
            </button>
          </div>
        ) : null}
        {!user.googleConnected && desk?.canConnectGoogle ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-md text-sm leading-6 text-ink/70">
              Your plan is paid. Connect the Google account you want Keyrank Solutions to use.
            </p>
            <button
              type="button"
              onClick={onConnectGoogle}
              disabled={oauthPending}
              className="bg-ink px-4 py-2.5 text-[0.68rem] font-semibold tracking-[0.16em] text-paper uppercase disabled:opacity-60"
            >
              {oauthPending ? "Opening Google…" : "Connect Google"}
            </button>
          </div>
        ) : null}
        {!user.googleConnected && !loading && !desk?.canConnectGoogle ? (
          <div className="mt-3">
            <p className="max-w-md text-sm leading-6 text-ink/70">
              Google connects after a paid plan. A free plan does not open this step.
            </p>
            <Link to="/vendor/plans" className="mt-4 inline-block text-[0.68rem] font-medium tracking-[0.16em] uppercase" style={{ color: "#b8893a" }}>
              View plans
            </Link>
          </div>
        ) : null}
      </section>
    </DashboardShell>
  );
}
