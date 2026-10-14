import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Toast({ toast, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) {
      setVisible(false);
      return undefined;
    }
    // Small delay to trigger CSS enter animation
    const enter = window.setTimeout(() => setVisible(true), 20);
    const timer = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(onClose, 350);
    }, 6000);
    return () => {
      window.clearTimeout(enter);
      window.clearTimeout(timer);
    };
  }, [toast, onClose]);

  if (!toast) return null;
  const success = toast.tone === "success";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 z-50 flex justify-center px-4 sm:justify-end sm:px-6">
      <div
        role="status"
        aria-live="polite"
        style={{
          transform: visible ? "translateY(0) scale(1)" : "translateY(-12px) scale(0.96)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease",
        }}
        className={`pointer-events-auto w-full max-w-sm relative overflow-hidden
          ${success
            ? "bg-pine-deep text-paper border border-gold/30"
            : "bg-white text-ink border border-clay/20"
          }`}
        style={{
          boxShadow: success
            ? "0 20px 50px rgba(16,14,12,0.3), 0 0 0 1px rgba(184,137,58,0.2), inset 0 1px 0 rgba(184,137,58,0.1)"
            : "0 20px 50px rgba(16,14,12,0.15), 0 0 0 1px rgba(155,58,47,0.1)",
          ...{ transform: visible ? "translateY(0) scale(1)" : "translateY(-12px) scale(0.96)",
               opacity: visible ? 1 : 0,
               transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease" }
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background: success
              ? "linear-gradient(90deg, rgba(184,137,58,0.8), rgba(184,137,58,0.3), transparent)"
              : "linear-gradient(90deg, rgba(155,58,47,0.8), rgba(155,58,47,0.3), transparent)",
          }}
        />

        <div className="px-4 py-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`mt-0.5 shrink-0 h-7 w-7 flex items-center justify-center rounded-full
              ${success ? "bg-gold/15 text-gold" : "bg-clay/10 text-clay"}`}>
              {success ? (
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
                </svg>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-[0.65rem] font-semibold tracking-[0.2em] uppercase
                ${success ? "text-gold" : "text-clay"}`}>
                {toast.title}
              </p>
              <p className={`mt-1.5 text-sm leading-5 ${success ? "text-paper/85" : "text-ink/80"}`}>
                {toast.message}
              </p>
              {toast.href ? (
                <Link
                  to={toast.href}
                  onClick={onClose}
                  className={`mt-2 inline-flex items-center gap-1.5 text-[0.68rem] font-medium tracking-[0.16em] uppercase transition-opacity hover:opacity-80
                    ${success ? "text-gold" : "text-clay"}`}
                >
                  View invoice
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Dismiss"
              className={`shrink-0 h-7 w-7 flex items-center justify-center rounded transition-colors
                ${success ? "text-paper/40 hover:text-paper/80 hover:bg-white/10" : "text-ink/30 hover:text-ink/70 hover:bg-ink/5"}`}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
