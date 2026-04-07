/**
 * ReadingProgress.tsx — Reading progress bar + back-to-top button Island.
 *
 * Hydration: client:idle — visual enhancement, not critical for initial render.
 *
 * Architecture:
 *   - Thin accent-colored bar fixed to the top of the viewport
 *   - Width represents scroll percentage (0% at top → 100% at bottom)
 *   - Back-to-top button appears after scrolling past 400px
 *   - Uses passive scroll listener for zero jank
 *   - Respects prefers-reduced-motion (hides animations)
 *   - Uses CSS custom properties for accent color integration
 */
import { useState, useEffect, useCallback } from "react";

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    function update() {
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) {
        setProgress(0);
        setShowBackToTop(false);
        return;
      }
      const scrollY = window.scrollY;
      setProgress(Math.min(100, (scrollY / scrollHeight) * 100));
      setShowBackToTop(scrollY > 400);
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      {/* Progress bar — fixed to top of viewport, above nav */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: `${progress}%`,
          height: "2px",
          background: "var(--color-accent)",
          zIndex: 99997,
          transition: "width 0.1s linear",
          pointerEvents: "none",
        }}
      />

      {/* Back-to-top button */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        style={{
          position: "fixed",
          bottom: "84px",
          right: "24px",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          color: "var(--color-muted)",
          cursor: "pointer",
          display: showBackToTop ? "inline-flex" : "none",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--shadow-md)",
          transition: "opacity 0.2s ease, color 0.15s ease, border-color 0.15s ease",
          opacity: showBackToTop ? 1 : 0,
          zIndex: 9990,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--color-accent)";
          e.currentTarget.style.borderColor = "var(--color-accent-border)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--color-muted)";
          e.currentTarget.style.borderColor = "var(--color-border)";
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </>
  );
}
