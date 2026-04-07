/**
 * contentMaturity.ts — Content maturity level configuration.
 *
 * Defines the visual representation (emoji, label, color, description)
 * for each maturity stage in the digital garden:
 *   - seedling:   Early idea, may be incomplete or speculative
 *   - budding:    Work in progress, main ideas forming
 *   - evergreen:  Mature, well-developed, regularly maintained
 *
 * Used by ContentMaturity.astro and NoteCard.astro components.
 */

export type MaturityLevel = "seedling" | "budding" | "evergreen";

export interface MaturityConfig {
  /** Unicode emoji for inline display */
  emoji: string;
  /** Human-readable label */
  label: string;
  /** Longer description for tooltips and screen readers */
  description: string;
  /** Tailwind text color class */
  textColor: string;
  /** Tailwind background color class */
  bgColor: string;
  /** Tailwind border color class */
  borderColor: string;
}

/**
 * Maturity level visual configuration.
 * Colors chosen to evoke growth stages while meeting WCAG 2.2 AA contrast.
 */
export const maturityConfig: Record<MaturityLevel, MaturityConfig> = {
  seedling: {
    emoji: "🌱",
    label: "Seedling",
    description: "Early idea — may be incomplete or speculative",
    textColor: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  budding: {
    emoji: "🌿",
    label: "Budding",
    description: "Work in progress — main ideas are forming",
    textColor: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  evergreen: {
    emoji: "🌳",
    label: "Evergreen",
    description: "Mature and well-developed — regularly maintained",
    textColor: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
  },
};

/** Get config for a maturity level with type safety */
export function getMaturityConfig(level: MaturityLevel): MaturityConfig {
  return maturityConfig[level];
}
