import { useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import { useAuth } from "../context/AuthContext";
import { listPlans } from "../api/plans";
import { assignVendorPlan, listVendors, removeVendorLogo, updateVendorStatus, uploadVendorLogo } from "../api/vendors";
import { adminNav } from "../lib/adminNav";
import { formatInr, formatWhen } from "../lib/money";

const PLAN_LABEL = {
  PAID: "Paid",
  CHOSEN: "Chosen",
  AWAITING_PAYMENT: "Awaiting payment",
};

function planPrice(plan) {
  if (!Number(plan.amount)) return "Free";
  return formatInr(plan.amount);
}

function planState(plan) {
  const label = PLAN_LABEL[plan.status] || plan.status;
  if (plan.expired) return `${label} · Expired`;
  if (plan.expiring) return `${label} · Ends soon`;
  return label;
}

const inputClass = "w-full border border-line bg-white/80 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-ink/30 focus:border-gold focus:bg-white";

function VendorLogo({ vendor, token, onDone }) {
  const [file, setFile] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onUpload(event) {
    event.preventDefault();
    if (!file) {
      setError("Choose a JPG, PNG, or WEBP logo.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = await uploadVendorLogo(token, vendor.id, file);
      setFile(null);
      onDone(result.data.imageUrl || null);
    } catch (uploadError) {
      setError(uploadError.message || "Could not save this logo");
    } finally {
      setPending(false);
    }
  }

  async function onRemove() {
    setPending(true);
    setError("");
    try {
      await removeVendorLogo(token, vendor.id);
      onDone(null);
    } catch (removeError) {
      setError(removeError.message || "Could not remove this logo");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onUpload} className="mt-4 flex flex-wrap items-center gap-3">
      {vendor.imageUrl ? (
        <img src={vendor.imageUrl} alt="" className="h-12 w-12 object-cover" />
      ) : (
        <div className="grid h-12 w-12 place-items-center border border-line text-[0.55rem] tracking-[0.12em] text-ink/35 uppercase">Logo</div>
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => setFile(event.target.files?.[0] || null)}
        className="min-w-0 flex-1 text-sm text-ink/70 file:mr-3 file:border file:border-line file:bg-paper file:px-3 file:py-2 file:text-[0.62rem] file:tracking-[0.12em] file:uppercase"
      />
      <button type="submit" disabled={pending} className="bg-ink px-3 py-2 text-[0.62rem] font-semibold tracking-[0.14em] text-paper uppercase disabled:opacity-60">
        {pending ? "Please wait…" : "Save logo"}
      </button>
      {vendor.imageUrl ? (
        <button type="button" onClick={onRemove} disabled={pending} className="border border-ink/25 px-3 py-2 text-[0.62rem] font-semibold tracking-[0.14em] uppercase disabled:opacity-60">
          Remove
        </button>
      ) : null}
      {error ? <p className="w-full text-[0.72rem] text-clay">{error}</p> : null}
    </form>
  );
}

function AssignPlan({ vendorId, plans, token, onDone }) {
  const [planId, setPlanId] = useState(plans[0]?.id || "");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    if (!planId) return;
    setPending(true);
    setError("");
    try {
      const result = await assignVendorPlan(token, vendorId, { planId, startsAt, endsAt });
      setStartsAt("");
      setEndsAt("");
      onDone(result.data);
    } catch (assignError) {
      setError(assignError.message || "Could not set this plan");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(227,216,200,0.6)" }}>
      <p className="text-[0.62rem] font-semibold tracking-[0.22em] uppercase" style={{ color: "#b8893a" }}>
        Set Plan
      </p>
      <p className="mt-1.5 text-xs leading-5 text-ink/50">
        This replaces the current plan. Leave the dates empty to use the plan length.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[0.68rem] font-medium text-ink/50">Plan</span>
          <select
            value={planId}
            onChange={(event) => setPlanId(event.target.value)}
            className={inputClass}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} · {plan.durationDays || 30} days
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[0.68rem] font-medium text-ink/50">Starts</span>
          <input type="date" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[0.68rem] font-medium text-ink/50">Ends</span>
          <input type="date" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className={inputClass} />
        </label>
      </div>
      {error ? <p className="mt-2 text-[0.72rem] text-clay">{error}</p> : null}
      <button
        type="submit"
        disabled={pending || !plans.length}
        className="btn-shine mt-3 inline-flex items-center gap-2 px-5 py-2.5 text-[0.68rem] font-semibold tracking-[0.16em] uppercase text-paper transition-all disabled:opacity-60"
        style={{ background: pending ? "rgba(16,14,12,0.7)" : "linear-gradient(135deg, #161311, #3d342b)" }}
      >
        {pending ? (
          <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {pending ? "Saving…" : "Set Plan"}
      </button>
    </form>
  );
}

export default function SuperadminVendorsPage() {
  const { token } = useAuth();
  const [directory, setDirectory] = useState({ count: 0, expiringCount: 0, vendors: [] });
  const [plans, setPlans] = useState([]);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState("");
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(query), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    listPlans(token)
      .then((result) => { if (active) setPlans(result.data || []); })
      .catch(() => { if (active) setPlans([]); });
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    listVendors(token, search)
      .then((result) => {
        if (!active) return;
        setDirectory(result.data || { count: 0, expiringCount: 0, vendors: [] });
        setBanner("");
      })
      .catch((error) => { if (active) setBanner(error.message || "Could not load vendors"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, search]);

  async function onStatus(vendor) {
    setBanner("");
    try {
      await updateVendorStatus(token, vendor.id, vendor.status === "BLOCKED" ? "ACTIVE" : "BLOCKED");
      setConfirmId(null);
      const result = await listVendors(token, search);
      setDirectory(result.data || { count: 0, expiringCount: 0, vendors: [] });
    } catch (error) {
      setBanner(error.message || "Could not update this vendor");
    }
  }

  return (
    <DashboardShell eyebrow="Superadmin" title="Vendors" nav={adminNav}>
      <p className="max-w-xl text-sm leading-6 text-ink/60 animate-fade-up">
        Search vendors, set a logo, block an account, and choose the plan and the dates it runs.
      </p>

      {/* Search + stat */}
      <div className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px] animate-fade-up" style={{ animationDelay: "60ms" }}>
        <label className="block">
          <span className="mb-1.5 block text-[0.68rem] font-medium tracking-[0.1em] text-ink/50">
            Search name, company, phone, or plan
          </span>
          <div className="relative">
            <svg className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink/35" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search vendors…"
              className="w-full border border-line bg-white/80 pl-10 pr-4 py-2.5 text-sm outline-none transition focus:border-gold focus:bg-white placeholder:text-ink/30"
            />
          </div>
        </label>

        <article
          className="relative overflow-hidden px-5 py-4 text-paper"
          style={{
            background: "linear-gradient(135deg, #100e0c 0%, #1e1a16 60%, #2a2118 100%)",
            border: "1px solid rgba(184,137,58,0.25)",
            boxShadow: "0 4px 20px rgba(16,14,12,0.2)",
          }}
        >
          <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full" style={{ background: "radial-gradient(circle, rgba(184,137,58,0.15) 0%, transparent 70%)" }} />
          <p className="text-[0.6rem] font-semibold tracking-[0.28em] uppercase" style={{ color: "rgba(184,137,58,0.7)" }}>Vendors</p>
          <p className="mt-1 font-serif text-4xl text-paper">{loading ? "—" : directory.count}</p>
          <p className="mt-1 text-[0.65rem] text-paper/50">
            {directory.expiringCount || 0} ending within 7 days
          </p>
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
          {[1, 2, 3].map((n) => (
            <div key={n} className="border border-line bg-white px-6 py-6 space-y-3">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-8 w-48" />
              <div className="skeleton h-4 w-36" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && !banner && directory.vendors.length === 0 ? (
        <article className="mt-8 flex flex-col items-center border border-dashed border-line bg-white px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(184,137,58,0.08)", border: "1px solid rgba(184,137,58,0.2)" }}>
            <svg className="h-7 w-7 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="mt-5 font-serif text-4xl text-ink/70">{search ? "No matches" : "No vendors yet"}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink/45">
            {search ? "Try another name, company, phone, or plan." : "When a vendor creates an account, they will show on this page."}
          </p>
        </article>
      ) : null}

      <div className="mt-6 space-y-4">
        {directory.vendors.map((vendor) => {
          const blocked = vendor.status === "BLOCKED";
          return (
            <article
              key={vendor.id}
              className="bg-white px-5 py-6 sm:px-6 card-hover"
              style={{
                border: "1px solid rgba(227,216,200,0.8)",
                boxShadow: "0 2px 8px rgba(16,14,12,0.05)",
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[0.62rem] font-semibold tracking-[0.22em] uppercase" style={{ color: "#b8893a" }}>
                    {vendor.companyName || "Vendor"}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl break-words text-ink">{vendor.name}</h2>
                  <p className="mt-1 text-sm text-ink/50">@{vendor.username}</p>
                  <VendorLogo
                    vendor={vendor}
                    token={token}
                    onDone={(imageUrl) => {
                      setDirectory((current) => ({
                        ...current,
                        vendors: current.vendors.map((item) => (item.id === vendor.id ? { ...item, imageUrl } : item)),
                      }));
                    }}
                  />
                </div>
                <span className={`inline-flex items-center rounded-sm px-2.5 py-1 text-[0.62rem] font-semibold tracking-[0.16em] uppercase
                  ${blocked ? "badge-blocked" : "badge-active"}`}>
                  {blocked ? (
                    <svg className="mr-1.5 h-2.5 w-2.5" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  ) : (
                    <svg className="mr-1.5 h-2.5 w-2.5" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  )}
                  {vendor.status}
                </span>
              </div>

              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2" style={{ borderTop: "1px solid rgba(227,216,200,0.5)", paddingTop: "1.25rem" }}>
                <div>
                  <dt className="text-[0.65rem] font-medium tracking-[0.12em] uppercase text-ink/40">Phone</dt>
                  <dd className="mt-1.5 text-sm text-ink/75">{vendor.phone}</dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] font-medium tracking-[0.12em] uppercase text-ink/40">Joined</dt>
                  <dd className="mt-1.5 text-sm text-ink/75">{formatWhen(vendor.createdAt)}</dd>
                </div>
              </dl>

              <div className="mt-5" style={{ borderTop: "1px solid rgba(227,216,200,0.5)", paddingTop: "1.25rem" }}>
                <p className="text-[0.62rem] font-semibold tracking-[0.22em] uppercase" style={{ color: "#b8893a" }}>Plan</p>
                {vendor.plans.length === 0 ? (
                  <p className="mt-2 text-sm text-ink/45">No plan yet</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {vendor.plans.map((plan) => (
                      <li key={`${plan.planName}-${plan.status}-${plan.updatedAt}`} className="rounded-sm bg-surface-muted px-3 py-2.5 text-sm" style={{ border: "1px solid rgba(227,216,200,0.6)" }}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-medium text-ink">{plan.planName}</span>
                          <span className={plan.expired || plan.expiring ? "text-clay text-xs" : "text-gold text-xs"}>
                            {planPrice(plan)} · {planState(plan)}
                          </span>
                        </div>
                        {plan.startsAt || plan.endsAt ? (
                          <p className="mt-1 text-[0.68rem] text-ink/45">
                            {formatWhen(plan.startsAt)} – {formatWhen(plan.endsAt)}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Block/Restore */}
              <div className="mt-5 flex flex-wrap gap-2" style={{ borderTop: "1px solid rgba(227,216,200,0.5)", paddingTop: "1.25rem" }}>
                {confirmId === vendor.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onStatus(vendor)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-[0.68rem] font-semibold tracking-[0.14em] uppercase text-white transition-all"
                      style={{ background: "#9b3a2f" }}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {blocked ? "Confirm Restore" : "Confirm Block"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="border border-line px-4 py-2.5 text-[0.68rem] font-medium tracking-[0.14em] uppercase text-ink/60 transition-colors hover:text-ink"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(vendor.id)}
                    className={`inline-flex items-center gap-2 border px-4 py-2.5 text-[0.68rem] font-semibold tracking-[0.14em] uppercase transition-all
                      ${blocked
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "border-clay/30 bg-clay/5 text-clay hover:bg-clay/10"
                      }`}
                  >
                    {blocked ? (
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                      </svg>
                    )}
                    {blocked ? "Restore Account" : "Block Account"}
                  </button>
                )}
              </div>

              <AssignPlan vendorId={vendor.id} plans={plans} token={token} onDone={setDirectory} />
            </article>
          );
        })}
      </div>
    </DashboardShell>
  );
}
