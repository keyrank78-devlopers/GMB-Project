import { useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import { useAuth } from "../context/AuthContext";
import { removeVendorImage, uploadVendorImage } from "../api/profile";
import { vendorNav } from "../lib/vendorNav";

const inputClass = "w-full border border-line bg-white/80 px-3.5 py-3 text-sm outline-none transition placeholder:text-ink/30 focus:border-gold focus:bg-white focus:shadow-[0_0_0_3px_rgba(184,137,58,0.10)]";

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.72rem] font-medium tracking-[0.08em] text-ink/55">{label}</span>
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

function EyeToggle({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="shrink-0 flex h-full items-center border-l border-line px-3.5 text-ink/35 transition-colors hover:text-ink/70"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        {show ? (
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
    </button>
  );
}

export default function VendorProfilePage() {
  const { user, token, updateProfile, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    companyName: "",
    currentPassword: "",
    newPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imageBusy, setImageBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      name: user.name || "",
      phone: user.phone || "",
      companyName: user.companyName || "",
    }));
  }, [user]);

  async function onUploadImage(event) {
    event.preventDefault();
    if (!imageFile) {
      setBanner("Choose a JPG, PNG, or WEBP image.");
      setNotice("");
      return;
    }
    setImageBusy(true);
    setBanner("");
    setNotice("");
    try {
      await uploadVendorImage(token, imageFile);
      await refreshUser();
      setImageFile(null);
      setNotice("Image saved");
    } catch (error) {
      setBanner(error.message || "The image could not be saved");
    } finally {
      setImageBusy(false);
    }
  }

  async function onRemoveImage() {
    setImageBusy(true);
    setBanner("");
    setNotice("");
    try {
      await removeVendorImage(token);
      await refreshUser();
      setImageFile(null);
      setNotice("Image removed");
    } catch (error) {
      setBanner(error.message || "The image could not be removed");
    } finally {
      setImageBusy(false);
    }
  }

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function validate() {
    const next = {};
    if (form.name.trim().length < 2) next.name = "Name must be at least 2 characters";
    if (form.companyName.trim().length < 2) next.companyName = "Company name must be at least 2 characters";
    if (!/^\+?[0-9]{10,15}$/.test(form.phone.trim())) next.phone = "Provide a valid phone number";
    if (form.newPassword && form.newPassword.length < 6) next.newPassword = "New password must be at least 6 characters";
    if (form.newPassword && !form.currentPassword) next.currentPassword = "Enter your current password";
    return next;
  }

  async function onSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    setBanner("");
    setNotice("");
    try {
      const result = await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        companyName: form.companyName.trim(),
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm((current) => ({ ...current, currentPassword: "", newPassword: "" }));
      setNotice(result.message || "Profile updated");
    } catch (error) {
      setBanner(error.message || "Could not update the profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardShell eyebrow="Vendor" title="Profile" nav={vendorNav}>
      <p className="max-w-xl text-sm leading-6 text-ink/60 animate-fade-up">
        Update the name, phone, and company on this account. The username stays the same.
      </p>

      <div className="mt-7 max-w-xl animate-fade-up" style={{ animationDelay: "60ms" }}>
        {/* Form card */}
        <div
          className="bg-white"
          style={{
            border: "1px solid rgba(227,216,200,0.8)",
            boxShadow: "0 4px 24px rgba(16,14,12,0.06)",
          }}
        >
          {/* Card header */}
          <div
            className="flex items-center gap-3 px-6 py-5"
            style={{ borderBottom: "1px solid rgba(227,216,200,0.6)" }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center shrink-0"
              style={{ background: "rgba(184,137,58,0.1)", border: "1px solid rgba(184,137,58,0.2)" }}
            >
              <svg className="h-4 w-4 text-gold" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <h2 className="font-serif text-xl text-ink">Edit Profile</h2>
          </div>

          <div className="space-y-3 px-6 pt-6">
            {banner ? (
              <div className="flex items-start gap-3 border border-clay/25 bg-clay/7 px-4 py-3 text-sm text-clay">
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {banner}
              </div>
            ) : null}
            {notice ? (
              <div className="flex items-start gap-3 px-4 py-3 text-sm text-ink" style={{ border: "1px solid rgba(184,137,58,0.3)", background: "rgba(184,137,58,0.06)" }}>
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-gold" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {notice}
              </div>
            ) : null}
          </div>

          <form onSubmit={onUploadImage} className="space-y-4 border-b border-line px-6 py-6">
            <p className="text-[0.65rem] font-medium tracking-[0.16em] uppercase text-ink/40">Company image</p>
            <div className="flex flex-wrap items-center gap-4">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="" className="h-16 w-16 object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center border border-line text-[0.6rem] tracking-[0.14em] text-ink/35 uppercase">None</div>
              )}
              <div className="min-w-0 flex-1">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                  className="block w-full text-sm text-ink/70 file:mr-3 file:border file:border-line file:bg-white file:px-3 file:py-2 file:text-[0.68rem] file:tracking-[0.12em] file:uppercase"
                />
                <p className="mt-2 text-[0.72rem] text-ink/45">JPG, PNG, or WEBP. 5 MB maximum.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={imageBusy}
                className="bg-ink px-4 py-2.5 text-[0.68rem] font-semibold tracking-[0.16em] text-paper uppercase disabled:opacity-60"
              >
                {imageBusy ? "Please wait…" : "Upload image"}
              </button>
              {user?.imageUrl ? (
                <button
                  type="button"
                  onClick={onRemoveImage}
                  disabled={imageBusy}
                  className="border border-ink/30 px-4 py-2.5 text-[0.68rem] font-semibold tracking-[0.16em] uppercase disabled:opacity-60"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </form>

          <form onSubmit={onSubmit} className="p-6 space-y-5" noValidate>
            {/* Info fields */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full Name" error={errors.name}>
                <input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} />
              </Field>
              <Field label="Phone Number" error={errors.phone}>
                <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </Field>
            </div>

            <Field label="Company Name" error={errors.companyName}>
              <input className={inputClass} value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
            </Field>

            <Field label="Username">
              <input
                className={`${inputClass} cursor-not-allowed`}
                style={{ background: "rgba(227,216,200,0.3)", color: "rgba(15,13,11,0.4)" }}
                value={user?.username || ""}
                disabled
              />
            </Field>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                <div className="w-full border-t border-line" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[0.65rem] tracking-[0.16em] uppercase text-ink/40">Change Password</span>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Current Password" error={errors.currentPassword}>
                <div className="flex border border-line bg-white/80 focus-within:border-gold focus-within:bg-white transition-all">
                  <input
                    className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-sm outline-none placeholder:text-ink/30"
                    type={showCurrent ? "text" : "password"}
                    value={form.currentPassword}
                    onChange={(e) => update("currentPassword", e.target.value)}
                    autoComplete="current-password"
                    placeholder="Current password"
                  />
                  <EyeToggle show={showCurrent} onToggle={() => setShowCurrent((c) => !c)} />
                </div>
              </Field>
              <Field label="New Password" error={errors.newPassword}>
                <div className="flex border border-line bg-white/80 focus-within:border-gold focus-within:bg-white transition-all">
                  <input
                    className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-sm outline-none placeholder:text-ink/30"
                    type={showNext ? "text" : "password"}
                    value={form.newPassword}
                    onChange={(e) => update("newPassword", e.target.value)}
                    autoComplete="new-password"
                    placeholder="New password"
                  />
                  <EyeToggle show={showNext} onToggle={() => setShowNext((c) => !c)} />
                </div>
              </Field>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-shine flex w-full items-center justify-center gap-2 px-5 py-3.5 text-[0.72rem] font-semibold tracking-[0.2em] uppercase text-paper transition-all disabled:opacity-60"
              style={{
                background: saving ? "rgba(16,14,12,0.6)" : "linear-gradient(135deg, #161311, #3d342b)",
                boxShadow: saving ? "none" : "0 4px 16px rgba(16,14,12,0.2)",
              }}
            >
              {saving ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Save Profile
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
