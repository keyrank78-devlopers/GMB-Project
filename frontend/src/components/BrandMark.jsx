import { useBrand } from "../context/BrandContext";

export default function BrandMark({ tone = "light", compact = false }) {
  const { brand } = useBrand();
  const onDark = tone === "dark";
  const name = brand.name || "Keyrank Solutions";

  return (
    <div className={`flex items-center gap-3 ${onDark ? "text-paper" : "text-ink"}`}>
      <div className="relative shrink-0">
        {brand.logoUrl ? (
          <img
            src={brand.logoUrl}
            alt=""
            className="h-11 w-11 object-cover"
            style={{ boxShadow: onDark ? "0 0 18px rgba(184,137,58,0.25)" : "0 2px 8px rgba(184,137,58,0.16)" }}
          />
        ) : (
          <span
            className={`grid h-11 w-11 place-items-center font-serif text-xl leading-none
              ${onDark
                ? "border border-gold/60 text-gold bg-gold/8 shadow-[0_0_18px_rgba(184,137,58,0.2)]"
                : "border border-gold/40 text-gold bg-gold/5 shadow-[0_2px_8px_rgba(184,137,58,0.1)]"
              }`}
          >
            K
          </span>
        )}
        <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 ${onDark ? "bg-gold/70" : "bg-accent"}`} />
      </div>

      <div className={compact ? "hidden sm:block" : "block"}>
        <span className={`block max-w-[9.5rem] text-[0.58rem] font-semibold leading-4 tracking-[0.18em] uppercase ${onDark ? "text-paper" : "text-ink"}`}>
          {name}
        </span>
        <span className={`mt-0.5 block text-[0.52rem] tracking-[0.18em] uppercase ${onDark ? "text-gold/80" : "text-accent"}`}>
          {brand.tagline || "Digital Marketing"}
        </span>
      </div>
    </div>
  );
}
