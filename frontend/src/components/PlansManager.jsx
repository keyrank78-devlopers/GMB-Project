import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createPlan, deletePlan, listPlans, updatePlan } from "../api/plans";

const emptyForm = {
  name: "",
  subtitle: "",
  price: "",
  durationDays: "30",
  features: [""],
};

function formatPrice(price) {
  const amount = Number(price);
  if (Number.isNaN(amount)) return "";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function validate(form) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = "Plan name must be at least 2 characters";
  else if (form.name.trim().length > 40) errors.name = "Plan name must be 40 characters or fewer";
  if (form.subtitle.trim().length < 2) errors.subtitle = "Subtitle must be at least 2 characters";
  else if (form.subtitle.trim().length > 120) errors.subtitle = "Subtitle must be 120 characters or fewer";
  if (form.price === "" || Number.isNaN(Number(form.price)) || Number(form.price) < 0) {
    errors.price = "Enter a price of 0 or more";
  }
  const days = Number(form.durationDays);
  if (!Number.isInteger(days) || days < 1 || days > 3650) {
    errors.durationDays = "Enter a length from 1 to 3650 days";
  }
  const features = form.features.map((item) => item.trim()).filter(Boolean);
  if (!features.length) errors.features = "Add at least one feature";
  else if (features.length > 30) errors.features = "Use 30 features or fewer";
  else if (features.some((item) => item.length > 160)) errors.features = "Each feature must be 160 characters or fewer";
  return errors;
}

function toPayload(form) {
  return {
    name: form.name.trim(),
    subtitle: form.subtitle.trim(),
    price: Number(form.price),
    durationDays: Number(form.durationDays),
    features: form.features.map((item) => item.trim()).filter(Boolean),
  };
}

const inputClass = "w-full border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-ink/35 focus:border-gold";

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-ink/70">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-clay">{error}</span> : null}
    </label>
  );
}

export default function PlansManager() {
  const { token } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await listPlans(token);
      setPlans(data.data || []);
      setBanner("");
    } catch (error) {
      setBanner(error.message || "Could not load plans");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    load();
  }, [token]);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateFeature(index, value) {
    setForm((current) => ({
      ...current,
      features: current.features.map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  }

  function addFeature() {
    setForm((current) => ({ ...current, features: [...current.features, ""] }));
  }

  function removeFeature(index) {
    setForm((current) => ({
      ...current,
      features: current.features.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setBanner("");
  }

  function startEdit(plan) {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      subtitle: plan.subtitle,
      price: String(plan.price),
      durationDays: String(plan.durationDays || 30),
      features: plan.features.length ? [...plan.features] : [""],
    });
    setErrors({});
    setBanner("");
    setConfirmId(null);
  }

  async function onSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    setBanner("");
    try {
      const payload = toPayload(form);
      if (editingId) await updatePlan(token, editingId, payload);
      else await createPlan(token, payload);
      setEditingId(null);
      setForm(emptyForm);
      await load();
    } catch (error) {
      const fieldErrors = {};
      for (const item of error.errors || []) {
        const key = String(item.field || "").startsWith("features") ? "features" : item.field;
        fieldErrors[key] = item.message;
      }
      setErrors(fieldErrors);
      setBanner(error.message || "Could not save the plan");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    setBanner("");
    try {
      await deletePlan(token, id);
      if (editingId === id) startCreate();
      setConfirmId(null);
      await load();
    } catch (error) {
      setBanner(error.message || "Could not delete the plan");
    }
  }

  return (
    <section id="plans">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl">Plans</h2>
          <p className="mt-1 text-sm text-ink/65">Create any plan. Name, price, length, subtitle, and features are yours to set.</p>
        </div>
        {editingId ? (
          <button type="button" onClick={startCreate} className="border border-line bg-white px-4 py-2 text-xs font-medium tracking-[0.14em] uppercase">
            New plan
          </button>
        ) : null}
      </div>

      {banner ? (
        <div className="mb-4 rounded-xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">{banner}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={onSubmit} className="border border-line bg-white p-6" noValidate>
          <h3 className="font-serif text-xl">{editingId ? "Edit plan" : "New plan"}</h3>
          <div className="mt-5 space-y-4">
            <Field label="Plan name" error={errors.name}>
              <input className={inputClass} value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Premium" />
            </Field>
            <Field label="Subtitle" error={errors.subtitle}>
              <input className={inputClass} value={form.subtitle} onChange={(event) => update("subtitle", event.target.value)} placeholder="For growing shops" />
            </Field>
            <Field label="Price" error={errors.price}>
              <input className={inputClass} inputMode="decimal" value={form.price} onChange={(event) => update("price", event.target.value)} placeholder="0" />
            </Field>
            <Field label="Length in days" error={errors.durationDays}>
              <input className={inputClass} inputMode="numeric" value={form.durationDays} onChange={(event) => update("durationDays", event.target.value)} placeholder="30" />
            </Field>
            <div>
              <span className="mb-1.5 block text-xs font-medium tracking-wide text-ink/70">Features</span>
              <div className="space-y-2">
                {form.features.map((feature, index) => (
                  <div key={index} className="flex flex-col gap-2 sm:flex-row">
                    <input
                      className={`${inputClass} min-w-0`}
                      value={feature}
                      onChange={(event) => updateFeature(index, event.target.value)}
                      placeholder="What this plan includes"
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      disabled={form.features.length === 1}
                      className="shrink-0 border border-line px-3 py-2 text-sm text-ink/70 disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              {errors.features ? <span className="mt-1 block text-xs text-clay">{errors.features}</span> : null}
              <button type="button" onClick={addFeature} className="mt-3 text-sm font-medium text-pine underline-offset-4 hover:underline">
                Add feature
              </button>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-ink px-5 py-3 text-xs font-semibold tracking-[0.16em] text-paper uppercase transition hover:bg-pine disabled:cursor-wait disabled:opacity-70"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Create plan"}
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {loading ? <p className="text-sm text-ink/60">Loading plans…</p> : null}
          {!loading && plans.length === 0 ? (
            <article className="border border-dashed border-line bg-white px-5 py-8 text-sm text-ink/65">
              No plans yet. The first one you save will show up here.
            </article>
          ) : null}
          {plans.map((plan) => (
            <article key={plan.id} className="border border-line bg-white px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-serif text-3xl break-words">{plan.name}</p>
                  <p className="mt-1 text-sm break-words text-ink/65">{plan.subtitle}</p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-3xl text-gold">{formatPrice(plan.price)}</p>
                  <p className="mt-1 text-xs tracking-[0.14em] text-ink/50 uppercase">{plan.durationDays || 30} days</p>
                </div>
              </div>
              <ul className="mt-4 space-y-1 text-sm text-ink/80">
                {plan.features.map((feature, index) => (
                  <li key={`${index}-${feature}`}>{feature}</li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => startEdit(plan)} className="bg-ink px-4 py-2 text-xs font-medium tracking-[0.12em] text-paper uppercase">
                  Edit
                </button>
                {confirmId === plan.id ? (
                  <>
                    <button type="button" onClick={() => onDelete(plan.id)} className="bg-clay px-4 py-2 text-xs font-medium tracking-[0.12em] text-white uppercase">
                      Confirm delete
                    </button>
                    <button type="button" onClick={() => setConfirmId(null)} className="border border-line px-4 py-2 text-xs tracking-[0.12em] uppercase">
                      Cancel
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setConfirmId(plan.id)} className="border border-line px-4 py-2 text-xs tracking-[0.12em] uppercase">
                    Delete
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
