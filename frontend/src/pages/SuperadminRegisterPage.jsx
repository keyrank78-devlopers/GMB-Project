import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dashboardPath } from "../lib/dashboardPath";
import BrandMark from "../components/BrandMark";

const emptyForm = {
  name: "",
  username: "",
  phone: "",
  password: "",
  email: "",
};

function validate(form) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = "Name must be at least 2 characters";
  if (!/^[a-zA-Z0-9._]{3,30}$/.test(form.username.trim())) {
    errors.username = "Use 3–30 letters, numbers, dots, or underscores";
  }
  if (!/^\+?[0-9]{10,15}$/.test(form.phone.trim())) errors.phone = "Provide a valid phone number";
  if (!form.password) errors.password = "Password is required";
  else if (form.password.length < 6) errors.password = "Password must be at least 6 characters";
  if (!form.email.trim()) errors.email = "Email is required";
  else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Provide a valid email";
  return errors;
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-ink/70">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-clay">{error}</span> : null}
    </label>
  );
}

const inputClass = "w-full rounded-none border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-ink/35 focus:border-gold";

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

export default function SuperadminRegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    setBanner("");
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const signedIn = await register("admin", {
        name: form.name.trim(),
        username: form.username.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        email: form.email.trim(),
      });
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
    <main className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative overflow-hidden bg-pine-deep px-6 py-8 text-paper sm:px-12 lg:min-h-screen lg:px-14 lg:py-16">
        <div className="pointer-events-none absolute inset-5 hidden border border-gold/30 lg:block" />
        <div className="relative flex flex-col gap-6 lg:h-full lg:justify-between lg:p-6">
          <BrandMark tone="dark" />
          <div>
            <p className="font-serif text-4xl leading-[0.95] sm:text-5xl lg:text-6xl">Create a superadmin.</p>
            <p className="mt-5 hidden max-w-sm text-sm leading-6 text-paper/70 lg:block">
              Sign-in uses the email and password from this form.
            </p>
          </div>
          {/* <p className="hidden text-[0.68rem] tracking-[0.28em] text-gold lg:block">HOUSE OF TRADE</p> */}
        </div>
      </section>

      <section className="px-5 py-8 sm:px-10 lg:px-14 lg:py-12">
        <div className="mx-auto w-full max-w-xl">
          <h1 className="font-serif text-5xl text-ink">Superadmin register</h1>
          <p className="mt-2 text-sm text-ink/65">Name, username, phone, password, and email.</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
            {banner ? (
              <div className="rounded-xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">{banner}</div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" error={errors.name}>
                <input className={inputClass} value={form.name} onChange={(event) => update("name", event.target.value)} autoComplete="name" />
              </Field>
              <Field label="Username" error={errors.username}>
                <input className={inputClass} value={form.username} onChange={(event) => update("username", event.target.value)} autoComplete="username" />
              </Field>
              <Field label="Phone" error={errors.phone}>
                <input className={inputClass} value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+919876543210" autoComplete="tel" />
              </Field>
              <Field label="Email" error={errors.email}>
                <input className={inputClass} type="email" value={form.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" />
              </Field>
            </div>

            <Field label="Password" error={errors.password}>
              <div className="relative">
                <input
                  className={`${inputClass} pr-11`}
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => update("password", event.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-ink/45 hover:text-ink"
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
            </Field>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full bg-ink px-5 py-3 text-xs font-semibold tracking-[0.18em] text-paper uppercase transition hover:bg-pine disabled:cursor-wait disabled:opacity-70"
            >
              {submitting ? "Please wait…" : "Create superadmin"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-5 text-sm text-pine underline-offset-4 hover:underline"
          >
            Back to sign in
          </button>
        </div>
      </section>
    </main>
  );
}
