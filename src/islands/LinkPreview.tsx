/**
 * LinkPreview.tsx — Link preview popup Island.
 *
 * Hydration: client:idle — not critical for initial interaction; loads after
 * the main content is interactive.
 *
 * Shows a preview tooltip on hover/focus for internal links in the main
 * content area. Reads the link preview manifest from a JSON block embedded
 * in BaseLayout by the build-time linkPreviews utility.
 *
 * Features:
 *   - Debounced hover (200ms delay) to prevent flicker on mouse-through
 *   - Keyboard accessible: appears on focus, dismissed with Escape
 *   - External DOI/arXiv links show "External link to {domain}"
 *   - Positioned tooltip avoids viewport edges
 */

import { useEffect, useRef } from "react";

interface PreviewEntry {
  url: string;
  title: string;
  type: string;
  description: string;
}

/** Type badge color accents (CSS color values) */
const TYPE_COLORS: Record<string, string> = {
  post: "#AFFFAB",
  project: "#818cf8",
  note: "#d29922",
  publication: "#3fb950",
  teaching: "#f97316",
};

export default function LinkPreview() {
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manifestRef = useRef<PreviewEntry[] | null>(null);

  useEffect(() => {
    /* Read the preview manifest from the embedded JSON */
    const manifestEl = document.getElementById("link-preview-data");
    if (manifestEl) {
      try {
        manifestRef.current = JSON.parse(
          manifestEl.textContent ?? "[]",
        ) as PreviewEntry[];
      } catch {
        manifestRef.current = [];
      }
    }

    /* Create the tooltip element */
    const tooltip = document.createElement("div");
    tooltip.className = "link-preview-tooltip";
    tooltip.setAttribute("role", "tooltip");
    tooltip.setAttribute("aria-hidden", "true");
    Object.assign(tooltip.style, {
      position: "fixed",
      zIndex: "50",
      maxWidth: "320px",
      padding: "12px 16px",
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "8px",
      boxShadow: "var(--shadow-lg)",
      fontSize: "13px",
      lineHeight: "1.5",
      color: "var(--color-text)",
      pointerEvents: "none",
      opacity: "0",
      transform: "translateY(4px)",
      transition: "opacity 0.15s ease, transform 0.15s ease",
      display: "none",
    });
    document.body.appendChild(tooltip);
    tooltipRef.current = tooltip;

    /* Find internal links in the main content area */
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    const links = mainContent.querySelectorAll<HTMLAnchorElement>(
      'a[href^="/"]',
    );

    function showPreview(link: HTMLAnchorElement): void {
      const tt = tooltipRef.current;
      if (!tt || !manifestRef.current) return;

      const href = link.getAttribute("href") ?? "";
      const normalized = href.endsWith("/") ? href : href + "/";

      const entry = manifestRef.current.find((e) => e.url === normalized);

      if (entry) {
        const color = TYPE_COLORS[entry.type] ?? "var(--color-muted)";
        tt.innerHTML = [
          `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">`,
          `<span style="padding:1px 6px;border-radius:4px;font-size:10px;font-weight:600;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:0.05em;background:${color}20;color:${color};border:1px solid ${color}40;">${entry.type}</span>`,
          `</div>`,
          `<div style="font-weight:600;color:var(--color-text);margin-bottom:4px;">${escapeHtml(entry.title)}</div>`,
          `<div style="font-size:12px;color:var(--color-muted);">${escapeHtml(entry.description)}</div>`,
        ].join("");
      } else {
        /* Internal page without preview data */
        tt.innerHTML = `<div style="font-size:12px;color:var(--color-muted);">Navigate to ${escapeHtml(href)}</div>`;
      }

      /* Position near the link */
      const rect = link.getBoundingClientRect();
      const ttW = 320;
      let left = rect.left + rect.width / 2 - ttW / 2;
      if (left < 8) left = 8;
      if (left + ttW > window.innerWidth - 8) left = window.innerWidth - ttW - 8;

      const spaceBelow = window.innerHeight - rect.bottom;
      const above = spaceBelow < 160 && rect.top > 160;

      tt.style.display = "block";
      tt.style.left = `${left}px`;
      if (above) {
        tt.style.top = "auto";
        tt.style.bottom = `${window.innerHeight - rect.top + 8}px`;
      } else {
        tt.style.top = `${rect.bottom + 8}px`;
        tt.style.bottom = "auto";
      }

      requestAnimationFrame(() => {
        tt.style.opacity = "1";
        tt.style.transform = "translateY(0)";
        tt.setAttribute("aria-hidden", "false");
      });
    }

    function hidePreview(): void {
      const tt = tooltipRef.current;
      if (!tt) return;
      tt.style.opacity = "0";
      tt.style.transform = "translateY(4px)";
      tt.setAttribute("aria-hidden", "true");
      setTimeout(() => {
        if (tt.style.opacity === "0") tt.style.display = "none";
      }, 150);
    }

    /* Attach debounced hover and focus listeners */
    for (const link of links) {
      /* Skip nav links, sidenote toggles, heading anchors */
      if (
        link.closest("nav") ||
        link.closest(".sidenote-toggle") ||
        link.classList.contains("heading-anchor") ||
        link.classList.contains("data-footnote-backref")
      )
        continue;

      link.addEventListener("mouseenter", () => {
        timerRef.current = setTimeout(() => showPreview(link), 200);
      });
      link.addEventListener("mouseleave", () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        hidePreview();
      });
      link.addEventListener("focusin", () => showPreview(link));
      link.addEventListener("focusout", () => hidePreview());
    }

    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") hidePreview();
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      tooltip.remove();
    };
  }, []);

  /* Renders nothing — behavior-only island */
  return null;
}

/** Minimal HTML escaping for text content */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
