import { useState } from "react";
import DashboardShell from "../components/DashboardShell";
import { useAuth } from "../context/AuthContext";
import { useBrand } from "../context/BrandContext";
import { removeCompanyLogo, removeCompanyPhoto, uploadCompanyLogo, uploadCompanyPhoto } from "../api/brand";
import { adminNav } from "../lib/adminNav";

function Message({ tone, children }) {
  if (!children) return null;
  const error = tone === "error";
  return (
    <p className={`px-4 py-3 text-sm ${error ? "border border-clay/25 bg-clay/7 text-clay" : "border border-gold/30 bg-gold/10 text-ink"}`}>
      {children}
    </p>
  );
}

export default function SuperadminBrandPage() {
  const { token } = useAuth();
  const { brand, setBrand } = useBrand();
  const [logoFile, setLogoFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [pending, setPending] = useState("");
  const [notice, setNotice] = useState("");
  const [banner, setBanner] = useState("");

  async function run(key, action, success) {
    setPending(key);
    setNotice("");
    setBanner("");
    try {
      const result = await action();
      if (result.data) setBrand(result.data);
      setNotice(success);
      return true;
    } catch (error) {
      setBanner(error.message || "The image could not be saved");
      return false;
    } finally {
      setPending("");
    }
  }

  return (
    <DashboardShell eyebrow="Superadmin" title="Keyrank Solutions" nav={adminNav}>
      <p className="max-w-xl text-sm leading-7 text-ink/65">
        The logo appears in the sidebar and on the sign-in page. Photos appear beside the sign-in form.
      </p>

      <div className="mt-6 space-y-3">
        <Message tone="error">{banner}</Message>
        <Message>{notice}</Message>
      </div>

      <section className="mt-6 border border-line bg-white px-5 py-6 sm:px-6">
        <p className="text-[0.62rem] font-semibold tracking-[0.22em] text-gold uppercase">Company logo</p>
        <div className="mt-4 flex flex-wrap items-center gap-5">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt="" className="h-20 w-20 object-cover" />
          ) : (
            <div className="grid h-20 w-20 place-items-center border border-line font-serif text-3xl text-gold">K</div>
          )}
          <form
            className="min-w-0 flex-1"
            onSubmit={(event) => {
              event.preventDefault();
              if (!logoFile) {
                setBanner("Choose a JPG, PNG, or WEBP logo.");
                setNotice("");
                return;
              }
              run("logo", () => uploadCompanyLogo(token, logoFile), "Company logo saved").then((ok) => {
                if (ok) setLogoFile(null);
              });
            }}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setLogoFile(event.target.files?.[0] || null)}
              className="block w-full text-sm text-ink/70 file:mr-3 file:border file:border-line file:bg-paper file:px-3 file:py-2 file:text-[0.68rem] file:tracking-[0.12em] file:uppercase"
            />
            <p className="mt-2 text-[0.72rem] text-ink/45">JPG, PNG, or WEBP. 5 MB maximum.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="submit" disabled={pending === "logo"} className="bg-ink px-4 py-2.5 text-[0.68rem] font-semibold tracking-[0.16em] text-paper uppercase disabled:opacity-60">
                {pending === "logo" ? "Please wait…" : "Save logo"}
              </button>
              {brand.logoUrl ? (
                <button
                  type="button"
                  disabled={Boolean(pending)}
                  onClick={() => run("logo-remove", () => removeCompanyLogo(token), "Company logo removed")}
                  className="border border-ink/30 px-4 py-2.5 text-[0.68rem] font-semibold tracking-[0.16em] uppercase disabled:opacity-60"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </section>

      <section className="mt-5 border border-line bg-white px-5 py-6 sm:px-6">
        <p className="text-[0.62rem] font-semibold tracking-[0.22em] text-gold uppercase">Company photos</p>
        <p className="mt-2 max-w-lg text-sm leading-6 text-ink/55">Up to 8 photos. They show on the sign-in page.</p>

        <form
          className="mt-4 flex flex-wrap items-center gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!photoFile) {
              setBanner("Choose a photo.");
              setNotice("");
              return;
            }
            run("photo", () => uploadCompanyPhoto(token, photoFile), "Company photo saved").then((ok) => {
              if (ok) setPhotoFile(null);
            });
          }}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
            className="block min-w-0 flex-1 text-sm text-ink/70 file:mr-3 file:border file:border-line file:bg-paper file:px-3 file:py-2 file:text-[0.68rem] file:tracking-[0.12em] file:uppercase"
          />
          <button type="submit" disabled={pending === "photo"} className="bg-accent px-4 py-2.5 text-[0.68rem] font-semibold tracking-[0.16em] text-paper uppercase disabled:opacity-60">
            {pending === "photo" ? "Please wait…" : "Add photo"}
          </button>
        </form>

        {brand.photos.length ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {brand.photos.map((photo) => (
              <figure key={photo.id} className="border border-line bg-paper">
                <img src={photo.url} alt="" className="aspect-square w-full object-cover" />
                <button
                  type="button"
                  disabled={Boolean(pending)}
                  onClick={() => run(photo.id, () => removeCompanyPhoto(token, photo.id), "Company photo removed")}
                  className="w-full px-2 py-2 text-[0.62rem] font-semibold tracking-[0.14em] text-clay uppercase disabled:opacity-60"
                >
                  {pending === photo.id ? "Please wait…" : "Remove"}
                </button>
              </figure>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-ink/45">No company photos yet.</p>
        )}
      </section>
    </DashboardShell>
  );
}
