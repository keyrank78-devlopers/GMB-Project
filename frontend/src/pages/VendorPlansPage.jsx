import { useCallback, useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import Toast from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { currentPurchase, listCatalog, reportPaymentFailure, startPurchase, verifyPurchase } from "../api/plans";
import { openRazorpayCheckout } from "../lib/razorpayCheckout";
import { vendorNav } from "../lib/vendorNav";

function PlanAction({ plan, choice, featured, pending, paid, onBuy }) {
  const selected = choice && String(choice.planId) === String(plan.id);
  const chosen = selected && choice.status === "CHOSEN";
  const label = pending ? "Please wait…" : paid ? "Paid" : chosen ? "Chosen" : plan.price > 0 ? "Buy Now" : "Choose Plan";

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => onBuy(plan)}
        disabled={pending || chosen || paid}
        className={`btn-shine relative w-full px-4 py-3.5 text-[0.72rem] font-semibold tracking-[0.2em] uppercase transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2
          ${featured
            ? "text-pine-deep"
            : "text-paper"
          }`}
        style={featured ? {
          background: paid || chosen ? "rgba(184,137,58,0.5)" : "linear-gradient(135deg, #e7c98a, #b8893a)",
          boxShadow: paid || chosen ? "none" : "0 4px 16px rgba(184,137,58,0.35)",
        } : {
          background: paid || chosen ? "rgba(16,14,12,0.5)" : "linear-gradient(135deg, #161311, #3d342b)",
          boxShadow: paid || chosen ? "none" : "0 4px 16px rgba(16,14,12,0.25)",
        }}
      >
        {pending ? (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : paid ? (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
        {label}
      </button>
      {selected && choice.status === "AWAITING_PAYMENT" && !pending ? (
        <p className={`mt-2.5 text-[0.68rem] text-center ${featured ? "text-paper/60" : "text-ink/50"}`}>
          Payment was not finished. Tap to open again.
        </p>
      ) : null}
    </div>
  );
}

function formatPrice(price) {
  const amount = Number(price);
  if (!amount) return "Free";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function PlanSkeleton() {
  return (
    <div className="border border-line bg-white px-6 py-8 space-y-4">
      <div className="skeleton h-3 w-24" />
      <div className="skeleton h-10 w-40" />
      <div className="skeleton h-8 w-28" />
      <div className="mt-6 space-y-2">
        {[1, 2, 3].map((n) => <div key={n} className="skeleton h-4 w-full" />)}
      </div>
      <div className="skeleton h-12 w-full mt-4" />
    </div>
  );
}

export default function VendorPlansPage() {
  const { token, user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [choice, setChoice] = useState(null);
  const [paidPlanIds, setPaidPlanIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState(null);
  const [banner, setBanner] = useState("");
  const [toast, setToast] = useState(null);
  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([listCatalog(token), currentPurchase(token)])
      .then(([catalog, purchase]) => {
        if (!active) return;
        setPlans(catalog.data || []);
        setChoice(purchase.data || null);
        setPaidPlanIds(purchase.paidPlanIds || []);
      })
      .catch((error) => {
        if (active) setBanner(error.message || "Could not load plans");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token]);

  async function onBuy(plan) {
    setBuyingId(plan.id);
    setBanner("");
    setToast(null);
    try {
      const data = await startPurchase(token, plan.id);
      setChoice(data.data);
      setPaidPlanIds(data.paidPlanIds || []);
      if (!data.data?.checkout) {
        const paid = data.data?.status === "PAID";
        setToast({
          tone: "success",
          title: paid ? "Already paid" : "Plan chosen",
          message: data.message,
          href: paid ? "/vendor/invoices" : "",
        });
        return;
      }
      await openRazorpayCheckout({
        checkout: data.data.checkout,
        user,
        onSuccess: async (response) => {
          const verified = await verifyPurchase(token, data.data.id, response);
          setChoice(verified.data);
          setPaidPlanIds(verified.paidPlanIds || []);
          setToast({
            tone: "success",
            title: "Payment received",
            message: `${verified.data.planName} is paid.`,
            href: verified.invoiceId ? `/vendor/invoices/${verified.invoiceId}` : "/vendor/invoices",
          });
        },
        onFailure: async (failure) => {
          let href = "";
          try {
            const recorded = await reportPaymentFailure(token, data.data.id, failure);
            href = recorded.invoiceId ? `/vendor/invoices/${recorded.invoiceId}` : "/vendor/invoices";
          } catch { href = ""; }
          setToast({
            tone: "error",
            title: "Payment declined",
            message: failure.description || "The payment was not completed.",
            href,
          });
        },
      });
    } catch (error) {
      setToast({
        tone: "error",
        title: "Payment declined",
        message: error.message || "Could not complete this payment",
      });
    } finally {
      setBuyingId(null);
    }
  }

  const featuredId = plans.length > 1 ? plans[plans.length - 1].id : null;

  return (
    <DashboardShell eyebrow="Vendor" title="Plans" nav={vendorNav}>
      <Toast toast={toast} onClose={dismissToast} />
      <p className="max-w-xl text-sm leading-6 text-ink/60 animate-fade-up">
        These are the plans your superadmin has published. Choose a free plan, or buy a paid one.
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
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((n) => <PlanSkeleton key={n} />)}
        </div>
      ) : null}

      {!loading && !banner && plans.length === 0 ? (
        <article className="mt-8 flex flex-col items-center border border-dashed border-line bg-white px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center" style={{ background: "rgba(184,137,58,0.08)", border: "1px solid rgba(184,137,58,0.2)" }}>
            <svg className="h-7 w-7 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
            </svg>
          </div>
          <p className="mt-5 font-serif text-4xl text-ink/70">No plans yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink/45">
            When the superadmin creates a plan, it will show on this page.
          </p>
        </article>
      ) : null}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3 animate-fade-up" style={{ animationDelay: "80ms" }}>
        {plans.map((plan) => {
          const featured = plan.id === featuredId && plan.price > 0;
          return (
            <article
              key={plan.id}
              className={`relative flex flex-col overflow-hidden px-6 py-8 transition-all duration-300
                ${featured
                  ? "md:-translate-y-2 md:shadow-[0_20px_50px_rgba(16,14,12,0.35)]"
                  : "card-hover"
                }`}
              style={featured ? {
                background: "linear-gradient(145deg, #100e0c 0%, #1e1a16 50%, #2a2118 100%)",
                border: "1px solid rgba(184,137,58,0.35)",
                boxShadow: "0 8px 32px rgba(16,14,12,0.3), inset 0 1px 0 rgba(184,137,58,0.12)",
              } : {
                border: "1px solid rgba(227,216,200,0.8)",
                background: "#ffffff",
                boxShadow: "0 2px 12px rgba(16,14,12,0.06)",
              }}
            >
              {/* Featured badge */}
              {featured && (
                <div
                  className="absolute top-4 right-4 px-2.5 py-1 text-[0.58rem] font-bold tracking-[0.2em] uppercase"
                  style={{ background: "rgba(184,137,58,0.2)", border: "1px solid rgba(184,137,58,0.35)", color: "#e7c98a" }}
                >
                  Most Popular
                </div>
              )}

              {/* Glow for featured */}
              {featured && (
                <div
                  className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-32 w-32 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(184,137,58,0.15) 0%, transparent 70%)" }}
                />
              )}

              <p className={`text-[0.62rem] font-semibold tracking-[0.26em] uppercase ${featured ? "" : ""}`}
                style={{ color: "#b8893a" }}>
                {plan.subtitle}
              </p>
              <h2 className={`mt-3 font-serif text-4xl ${featured ? "text-paper" : "text-ink"}`}>
                {plan.name}
              </h2>
              <div className="mt-4 flex items-end gap-2">
                <p className={`font-serif text-5xl leading-none ${featured ? "text-paper" : ""}`}
                  style={{ color: featured ? "#e7c98a" : "#b8893a" }}>
                  {formatPrice(plan.price)}
                </p>
              </div>
              <p className={`mt-2 text-[0.68rem] tracking-[0.16em] uppercase ${featured ? "text-paper/50" : "text-ink/40"}`}>
                {plan.durationDays || 30} days
              </p>

              {/* Separator */}
              <div className="my-6 h-px" style={{ background: featured ? "rgba(184,137,58,0.2)" : "rgba(227,216,200,0.8)" }} />

              <ul className="flex-1 space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={`${index}-${feature}`} className="flex items-start gap-3">
                    <span
                      className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm"
                      style={{
                        background: featured ? "rgba(184,137,58,0.2)" : "rgba(184,137,58,0.1)",
                        border: "1px solid rgba(184,137,58,0.3)",
                      }}
                    >
                      <svg className="h-2.5 w-2.5 text-gold" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className={`text-sm leading-5 ${featured ? "text-paper/80" : "text-ink/70"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <PlanAction
                plan={plan}
                choice={choice}
                featured={featured}
                pending={buyingId === plan.id}
                paid={paidPlanIds.includes(String(plan.id))}
                onBuy={onBuy}
              />
            </article>
          );
        })}
      </div>
    </DashboardShell>
  );
}
