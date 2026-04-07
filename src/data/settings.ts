/**
 * settings.ts — Typed site settings reader.
 *
 * Reads src/data/settings.json at build time and exports typed accessors
 * with safe defaults for every field. Components import from this module
 * to check feature flags and appearance settings.
 *
 * The settings file is editable via the Sveltia CMS admin page
 * (file collection "Site Settings" → "Features & Appearance").
 * Changes are committed to git and take effect on the next build.
 *
 * Architecture:
 *   - Build-time only: settings are baked into static HTML
 *   - Safe defaults: if a key is missing, the feature defaults to a
 *     sensible value (generally "enabled" for existing features)
 *   - Type-safe: every setting has an explicit TypeScript type
 */

import rawSettings from "./settings.json";

/* ── Type definitions ─────────────────────────────────────────────────────── */

export interface FeatureSettings {
  /** Block all content with a maintenance overlay (bypass with ?preview=true) */
  maintenanceMode: boolean;
  /** Default accent color preset ID (mint, blue, violet, rose, amber, cyan, teal, orange) */
  defaultAccent: string;
  /** Transform footnotes into Tufte-style margin notes */
  sidenotes: boolean;
  /** Compute and display bidirectional backlinks */
  backlinks: boolean;
  /** Show table of contents on blog posts */
  tableOfContents: boolean;
  /** Enable hover/focus link preview popovers */
  linkPreviews: boolean;
  /** Enable the /search/ page with Pagefind */
  searchPage: boolean;
  /** Enable the /graph/ page with D3 force-directed visualization */
  researchGraph: boolean;
  /** Show seedling/budding/evergreen maturity badges on notes */
  contentMaturityBadges: boolean;
  /** Show copy button on code blocks */
  copyCodeButton: boolean;
  /** Click-to-zoom on images inside article content */
  imageZoom: boolean;
  /** Inline document/PDF preview overlay */
  documentViewer: boolean;
  /** Show reading progress bar on article pages (Phase 2) */
  readingProgressBar: boolean;
  /** Enable ⌘K / Ctrl+K command palette (Phase 2) */
  commandPalette: boolean;
  /** Enable ambient canvas visual effects (Phase 3) */
  visualEffects: boolean;
  /** Enable AI chat widget (Phase 4) */
  chatWidget: boolean;
  /** Enable CV/resume document request modal with gated access */
  documentRequestModal: boolean;
}

export interface SectionSettings {
  /** Show Publications section in nav and build publication pages */
  publications: boolean;
  /** Show Projects section */
  projects: boolean;
  /** Show Blog section */
  blog: boolean;
  /** Show Notes/digital garden section */
  notes: boolean;
  /** Show Teaching section */
  teaching: boolean;
  /** Show CV page */
  cv: boolean;
  /** Show About page */
  about: boolean;
  /** Show Contact page */
  contact: boolean;
}

export interface AppearanceSettings {
  /** Default theme: light, dark, or system (follows OS preference) */
  defaultTheme: "light" | "dark" | "system";
  /** Loading animation style: none, monogram, terminal, pulse, name */
  loadingAnimation: "none" | "monogram" | "terminal" | "pulse" | "name";
  /** Enable Astro View Transitions for smooth page navigation */
  viewTransitions: boolean;
  /** Enable scroll-reveal animations on page elements */
  scrollReveal: boolean;
  /** Use custom SVG cursor themed to accent color */
  customCursor: boolean;
}

export interface SiteSettings {
  features: FeatureSettings;
  sections: SectionSettings;
  appearance: AppearanceSettings;
}

/* ── Safe defaults ────────────────────────────────────────────────────────── */

const defaultFeatures: FeatureSettings = {
  maintenanceMode: false,
  defaultAccent: "mint",
  sidenotes: true,
  backlinks: true,
  tableOfContents: true,
  linkPreviews: true,
  searchPage: true,
  researchGraph: true,
  contentMaturityBadges: true,
  copyCodeButton: true,
  imageZoom: true,
  documentViewer: true,
  readingProgressBar: false,
  commandPalette: false,
  visualEffects: false,
  chatWidget: false,
  documentRequestModal: true,
};

const defaultSections: SectionSettings = {
  publications: true,
  projects: true,
  blog: true,
  notes: true,
  teaching: true,
  cv: true,
  about: true,
  contact: true,
};

const defaultAppearance: AppearanceSettings = {
  defaultTheme: "dark",
  loadingAnimation: "none",
  viewTransitions: true,
  scrollReveal: false,
  customCursor: false,
};

/* ── Merge raw JSON with defaults (handles missing keys gracefully) ───── */

const raw = rawSettings as Partial<SiteSettings>;

export const features: FeatureSettings = {
  ...defaultFeatures,
  ...(raw.features ?? {}),
};

export const sections: SectionSettings = {
  ...defaultSections,
  ...(raw.sections ?? {}),
};

export const appearance: AppearanceSettings = {
  ...defaultAppearance,
  ...(raw.appearance ?? {}),
};

/** Full settings object for components that need everything */
export const settings: SiteSettings = {
  features,
  sections,
  appearance,
};
