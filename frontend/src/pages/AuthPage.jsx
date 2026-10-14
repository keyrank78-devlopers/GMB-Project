import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dashboardPath } from "../lib/dashboardPath";
import BrandMark from "../components/BrandMark";
import { useBrand } from "../context/BrandContext";

const emptyForm = {
  name: "",
  phone: "",
  username: "",
  password: "",
  companyName: "",
  email: "",
};

function validate(role, mode, form) {
  const errors = {};
  if (!form.password) errors.password = "Password is required";
  else if (mode === "register" && form.password.length < 6) errors.password = "Password must be at least 6 characters";

  if (role === "admin") {
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Provide a valid email";
    return errors;
  }

  if (!/^[a-zA-Z0-9._]{3,30}$/.test(form.username.trim())) {
    errors.username = "Use 3–30 letters, numbers, dots, or underscores";
  }
  if (mode === "login") return errors;

  if (form.name.trim().length < 2) errors.name = "Name must be at least 2 characters";
  if (form.companyName.trim().length < 2) errors.companyName = "Company name must be at least 2 characters";
  if (!/^\+?[0-9]{10,15}$/.test(form.phone.trim())) errors.phone = "Provide a valid phone number";
  return errors;
}

function toPayload(form) {
  return {
    name: form.name.trim(),
    phone: form.phone.trim(),
    username: form.username.trim().toLowerCase(),
    password: form.password,
    companyName: form.companyName.trim(),
  };
}

function Field({ label, name, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.72rem] font-medium tracking-[0.08em] text-ink/60">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 flex items-center gap-1.5 text-[0.72rem] text-clay">
          <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </span>
      ) : null}
    </label>
  );
}

const inputClass = "input-premium w-full border border-line bg-white/70 px-4 py-3 text-sm outline-none transition placeholder:text-ink/30 focus:border-gold focus:bg-white";

function EyeIcon({ off = false }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      {off ? (
        <>
          <path d="M3 3l18 18" strokeLinecap="round" />
          <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6" strokeLinecap="round" />
          <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.5 0 9.5 4.5 10.5 7-.4 1-1.2 2.3-2.3 3.5M6.1 6.1C4.1 7.5 2.6 9.4 1.5 12c1 2.5 5 7 10.5 7 1.4 0 2.7-.3 3.9-.8" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

/* Decorative stats for left panel */
function StatPill({ value, label }) {
  return (
    <div className="flex flex-col items-center rounded-sm border border-gold/20 bg-white/5 px-4 py-3 backdrop-blur-sm">
      <span className="font-serif text-2xl text-gold">{value}</span>
      <span className="mt-0.5 text-[0.6rem] tracking-[0.2em] text-paper/50 uppercase">{label}</span>
    </div>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { brand } = useBrand();
  const { login, register } = useAuth();
  const [role, setRole] = useState("admin");
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const title = useMemo(() => {
    const person = role === "admin" ? "Superadmin" : "Vendor";
    return mode === "login" ? `${person} Sign In` : `Create ${person} Account`;
  }, [mode, role]);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function switchRole(nextRole) {
    setRole(nextRole);
    if (nextRole === "admin") setMode("login");
    setShowPassword(false);
    setErrors({});
    setBanner("");
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setShowPassword(false);
    setErrors({});
    setBanner("");
  }

  async function onSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(role, mode, form);
    setErrors(nextErrors);
    setBanner("");
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const signedIn = mode === "login"
        ? await login(role, role === "admin"
          ? { email: form.email.trim(), password: form.password }
          : { username: form.username.trim().toLowerCase(), password: form.password })
        : await register("vendor", toPayload(form));
      navigate(dashboardPath(signedIn.role));
    } catch (error) {
      const fieldErrors = {};
      for (const item of error.errors || []) fieldErrors[item.field] = item.message;
      setErrors(fieldErrors);
      setBanner(error.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
      {/* ── Left panel ── */}
      <section className="relative overflow-hidden bg-pine-deep px-6 py-10 text-paper sm:px-12 lg:min-h-screen lg:px-14 lg:py-16">
        {/* Mesh background */}
        <div className="auth-mesh absolute inset-0 opacity-100" />

        {/* Radial glow */}
        <div
          className="pointer-events-none absolute top-1/4 left-1/3 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(184,137,58,0.12) 0%, transparent 70%)" }}
        />

        {/* Decorative border frame */}
        <div className="pointer-events-none absolute inset-5 hidden border border-gold/15 lg:block" />
        <div className="pointer-events-none absolute inset-7 hidden border border-gold/06 lg:block" />

        {/* Corner accents */}
        <div className="pointer-events-none absolute top-5 left-5 hidden h-8 w-8 border-l-2 border-t-2 border-gold/40 lg:block" />
        <div className="pointer-events-none absolute top-5 right-5 hidden h-8 w-8 border-r-2 border-t-2 border-gold/40 lg:block" />
        <div className="pointer-events-none absolute bottom-5 left-5 hidden h-8 w-8 border-l-2 border-b-2 border-gold/40 lg:block" />
        <div className="pointer-events-none absolute bottom-5 right-5 hidden h-8 w-8 border-r-2 border-b-2 border-gold/40 lg:block" />

        <div className="relative flex flex-col gap-8 lg:h-full lg:justify-between lg:p-4">
          <BrandMark tone="dark" />

          <div className="animate-fade-up">
            <p
              className="font-serif leading-[0.9] text-4xl sm:text-5xl lg:text-[3.8rem]"
              style={{ fontStyle: "italic" }}
            >
              The private desk<br />
              <span className="not-italic" style={{
                background: "linear-gradient(135deg, #e7c98a, #b8893a, #7c5e28)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>of {brand.name}.</span>
            </p>
            <p className="mt-5 hidden max-w-sm text-sm leading-7 text-paper/60 lg:block">
              Superadmins sign in with email. Vendors register with a company name and sign in with a username.
            </p>

            {/* Stats row */}
            {brand.photos.length ? (
              <div className="mt-8 hidden grid-cols-4 gap-2 lg:grid">
                {brand.photos.slice(0, 4).map((photo) => (
                  <img key={photo.id} src={photo.url} alt="" className="aspect-square w-full object-cover" />
                ))}
              </div>
            ) : (
              <div className="mt-8 hidden grid-cols-3 gap-3 lg:grid">
                <StatPill value="SEO" label="Search rank" />
                <StatPill value="360°" label="Coverage" />
                <StatPill value="24/7" label="Support" />
              </div>
            )}
          </div>

          <div className="hidden items-center justify-between lg:flex">
            <p className="text-[0.6rem] tracking-[0.3em] text-gold/70 uppercase">· {brand.tagline}</p>
            <div className="h-px w-10" style={{ background: "rgba(184,137,58,0.3)" }} />
          </div>
        </div>
      </section>

      {/* ── Right panel (form) ── */}
      <section className="flex items-start justify-center px-5 py-10 sm:px-10 lg:items-center lg:px-14 lg:py-12">
        <div className="w-full max-w-lg animate-fade-up">
          {/* Role tabs */}
          <div className="mb-8 flex overflow-hidden border border-line bg-white">
            {["admin", "vendor"].map((item) => (
              <button
                key={item}
                type="button"
                id={`tab-${item}`}
                onClick={() => switchRole(item)}
                className={`relative flex-1 px-4 py-3 text-[0.72rem] font-semibold tracking-[0.2em] uppercase transition-all duration-200
                  ${role === item
                    ? "bg-ink text-paper"
                    : "text-ink/50 hover:text-ink/80 hover:bg-ink/3"
                  }`}
              >
                {role === item && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: "linear-gradient(90deg, #b8893a, #e7c98a, #b8893a)" }}
                  />
                )}
                {item === "admin" ? "Superadmin" : "Vendor"}
              </button>
            ))}
          </div>

          {/* Title */}
          <div className="mb-7">
            <h1 className="font-serif text-4xl text-ink sm:text-5xl">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-ink/55">
              {role === "admin"
                ? "Use the superadmin email and password."
                : mode === "login"
                ? "Use the vendor username and password."
                : "Fill in your name, phone, username, password, and company name."}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {banner ? (
              <div className="flex items-start gap-3 border border-clay/25 bg-clay/7 px-4 py-3 text-sm text-clay">
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {banner}
              </div>
            ) : null}

            {role === "vendor" && mode === "register" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name" error={errors.name}>
                  <input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} autoComplete="name" placeholder="John Doe" />
                </Field>
                <Field label="Phone" error={errors.phone}>
                  <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="9876543210" autoComplete="tel" />
                </Field>
                <Field label="Company Name" error={errors.companyName} name="companyName">
                  <input className={inputClass} value={form.companyName} onChange={(e) => update("companyName", e.target.value)} placeholder="Acme Corp" />
                </Field>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              {role === "admin" ? (
                <Field label="Email Address" error={errors.email}>
                  <input className={inputClass} type="email" value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" placeholder="admin@keyrank.com" />
                </Field>
              ) : (
                <Field label="Username" error={errors.username}>
                  <input className={inputClass} value={form.username} onChange={(e) => update("username", e.target.value)} autoComplete="username" placeholder="vendor_name" />
                </Field>
              )}
              <Field label="Password" error={errors.password}>
                <div className="relative">
                  <input
                    className={`${inputClass} pr-12`}
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((c) => !c)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute top-1/2 right-3.5 -translate-y-1/2 text-ink/35 transition-colors hover:text-ink/70"
                  >
                    <EyeIcon off={showPassword} />
                  </button>
                </div>
              </Field>
            </div>

            <button
              id="auth-submit"
              type="submit"
              disabled={submitting}
              className="btn-shine mt-2 flex w-full items-center justify-center gap-2 px-5 py-3.5 text-[0.72rem] font-semibold tracking-[0.2em] uppercase transition-all duration-200 disabled:cursor-wait disabled:opacity-70"
              style={{
                background: submitting
                  ? "rgba(16,14,12,0.7)"
                  : "linear-gradient(135deg, #161311 0%, #3d342b 100%)",
                color: "#f5f0e8",
              }}
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Please wait…
                </>
              ) : (
                <>
                  {mode === "login" ? "Sign In" : "Create Account"}
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {role === "vendor" ? (
            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <button
                type="button"
                id="auth-mode-toggle"
                onClick={() => switchMode(mode === "login" ? "register" : "login")}
                className="text-[0.72rem] font-medium tracking-[0.08em] text-pine transition-colors hover:text-gold"
              >
                {mode === "login" ? "Need an account? Register →" : "Already registered? Sign in →"}
              </button>
              <div className="h-px flex-1 bg-line" />
            </div>
          ) : null}

          {/* Security note */}
          <p className="mt-8 flex items-center gap-2 text-[0.62rem] tracking-[0.1em] text-ink/35">
            <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Secured with encrypted authentication. {brand.name} © 2026.
          </p>
        </div>
      </section>
    </main>
  );
}
