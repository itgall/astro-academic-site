/**
 * VisualEffects.tsx — Ambient canvas visual effects Island.
 *
 * Hydration: client:idle — purely decorative, zero functional impact.
 *
 * Renders a full-viewport canvas behind all page content with two layered
 * effects that can be toggled independently via the `mode` prop:
 *
 *   1. **Living Particles** — Floating nodes with connection lines between
 *      nearby particles. Particles near the mouse cursor glow and form
 *      denser connections. Creates a subtle, living network visualization
 *      that evokes research/knowledge graphs.
 *
 *   2. **Ambient Dust** — Fine floating particles that drift slowly across
 *      the viewport, creating depth and atmosphere.
 *
 * Architecture:
 *   - Single requestAnimationFrame loop for all effects
 *   - Reads accent color from CSS custom properties (--color-accent)
 *   - Adapts opacity and colors for light vs dark mode
 *   - Reduces particle count on mobile (< 768px) for performance
 *   - Respects prefers-reduced-motion (disables entirely)
 *   - Fixed position, pointer-events: none, z-index: 0 (behind content)
 *   - Canvas resolution scales with devicePixelRatio for sharp rendering
 */
import { useEffect, useRef } from "react";

/** Parse a hex color string into [r, g, b] tuple */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  if (clean.length < 6) return [150, 220, 170];
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

/** Detect if the current theme is light mode */
function isLightMode(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute("data-theme") === "light";
}

/** Get the current accent color as [r, g, b] */
function getAccentRgb(): [number, number, number] {
  if (typeof document === "undefined") return [175, 255, 171];
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-accent")
    .trim();
  return hexToRgb(accent || "#AFFFAB");
}

/* ── Particle type ────────────────────────────────────────────────────────── */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  /** Base opacity before distance/mouse modifiers */
  alpha: number;
}

/* ── Dust particle type ───────────────────────────────────────────────────── */

interface DustMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  /** Sine phase offset for gentle drifting */
  phase: number;
}

export default function VisualEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /** Respect prefers-reduced-motion */
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const isMobile = window.innerWidth < 768;

    /* ── Configuration ─────────────────────────────────────────────────── */
    const PARTICLE_COUNT = isMobile ? 20 : 40;
    const DUST_COUNT = isMobile ? 60 : 120;
    const CONNECT_DIST = 140;
    const MOUSE_DIST = 180;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let mouseX = -999;
    let mouseY = -999;
    let light = isLightMode();
    let [accentR, accentG, accentB] = getAccentRgb();

    /* ── Opacity tuning per theme ──────────────────────────────────────── */
    function particleAlpha(): number { return light ? 0.12 : 0.28; }
    function lineAlpha(): number { return light ? 0.05 : 0.10; }
    function dustAlpha(): number { return light ? 0.06 : 0.12; }

    /* ── Canvas sizing ─────────────────────────────────────────────────── */
    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    /* ── Initialize particles ──────────────────────────────────────────── */
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: 1.2 + Math.random() * 1.5,
        alpha: 0.5 + Math.random() * 0.5,
      });
    }

    /* ── Initialize dust motes ─────────────────────────────────────────── */
    const dust: DustMote[] = [];
    for (let i = 0; i < DUST_COUNT; i++) {
      dust.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -0.05 - Math.random() * 0.15,
        size: 0.5 + Math.random() * 1.2,
        alpha: 0.2 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;

    /* ── Animation loop ────────────────────────────────────────────────── */
    function animate() {
      time += 0.005;
      ctx.clearRect(0, 0, width, height);

      /* ── Draw dust motes ─────────────────────────────────────────────── */
      const dAlpha = dustAlpha();
      const dustR = light ? 100 : 160;
      const dustG = light ? 102 : 165;
      const dustB = light ? 108 : 175;

      for (const d of dust) {
        d.x += d.vx + Math.sin(time * 2 + d.phase) * 0.08;
        d.y += d.vy;

        /* Wrap around edges */
        if (d.x < -5) d.x = width + 5;
        if (d.x > width + 5) d.x = -5;
        if (d.y < -5) { d.y = height + 5; d.x = Math.random() * width; }
        if (d.y > height + 5) { d.y = -5; d.x = Math.random() * width; }

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dustR},${dustG},${dustB},${dAlpha * d.alpha})`;
        ctx.fill();
      }

      /* ── Draw particle connections ────────────────────────────────────── */
      const lAlpha = lineAlpha();

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECT_DIST) {
            const opacity = (1 - dist / CONNECT_DIST) * lAlpha;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${accentR},${accentG},${accentB},${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      /* ── Draw and update particles ────────────────────────────────────── */
      const pAlpha = particleAlpha();

      for (const p of particles) {
        /* Mouse interaction: glow near cursor */
        const mdx = p.x - mouseX;
        const mdy = p.y - mouseY;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        const mouseInfluence = mDist < MOUSE_DIST ? (1 - mDist / MOUSE_DIST) : 0;

        /* Draw particle */
        const size = p.size + mouseInfluence * 2;
        const alpha = pAlpha * p.alpha + mouseInfluence * 0.3;

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${accentR},${accentG},${accentB},${alpha})`;
        ctx.fill();

        /* Glow ring on mouse-proximate particles */
        if (mouseInfluence > 0.1) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, size + 4 * mouseInfluence, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${accentR},${accentG},${accentB},${mouseInfluence * 0.15})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        /* Draw mouse-to-particle connection lines */
        if (mouseInfluence > 0) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouseX, mouseY);
          ctx.strokeStyle = `rgba(${accentR},${accentG},${accentB},${mouseInfluence * lAlpha * 1.5})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        /* Update position */
        p.x += p.vx;
        p.y += p.vy;

        /* Soft repulsion from mouse */
        if (mDist < MOUSE_DIST && mDist > 0) {
          p.vx += (mdx / mDist) * 0.02 * mouseInfluence;
          p.vy += (mdy / mDist) * 0.02 * mouseInfluence;
        }

        /* Damping */
        p.vx *= 0.998;
        p.vy *= 0.998;

        /* Wrap around edges */
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;
      }

      frameRef.current = requestAnimationFrame(animate);
    }

    frameRef.current = requestAnimationFrame(animate);

    /* ── Event listeners ───────────────────────────────────────────────── */
    function handleMouse(e: MouseEvent) { mouseX = e.clientX; mouseY = e.clientY; }
    function handleMouseLeave() { mouseX = -999; mouseY = -999; }
    function handleResize() { resize(); }

    /** Re-read accent color and theme when they change */
    const observer = new MutationObserver(() => {
      light = isLightMode();
      [accentR, accentG, accentB] = getAccentRgb();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-accent", "style"],
    });

    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("mousemove", handleMouse, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(frameRef.current);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousemove", handleMouse);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
