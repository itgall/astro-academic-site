/**
 * readingTime.ts — Reading time estimator.
 *
 * Calculates estimated reading time from raw Markdown content.
 * Accounts for different reading speeds for prose vs code blocks,
 * and adds time for images.
 *
 * Rates:
 *   - Prose: 225 WPM (academic content reads slower than casual)
 *   - Code blocks: 100 WPM (readers parse code more carefully)
 *   - Images: +12 seconds per image
 */

const PROSE_WPM = 225;
const CODE_WPM = 100;
const SECONDS_PER_IMAGE = 12;

export interface ReadingTime {
  /** Estimated reading time in minutes (rounded up, minimum 1) */
  minutes: number;
  /** Human-readable string, e.g. "5 min read" */
  text: string;
}

/**
 * Calculate estimated reading time from raw Markdown content.
 *
 * Separates code blocks (fenced with ```) from prose, counts each
 * at its respective WPM rate, and adds time for inline images.
 */
export function calculateReadingTime(content: string): string {
  if (!content) return "1 min read";

  /* Split content into code blocks and prose */
  const codeBlockRe = /```[\s\S]*?```/g;
  const codeBlocks = content.match(codeBlockRe) ?? [];
  const prose = content.replace(codeBlockRe, "");

  /* Count words in prose and code separately */
  const proseWords = prose.split(/\s+/).filter(Boolean).length;
  const codeWords = codeBlocks
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

  /* Count images (Markdown and HTML img tags) */
  const imageCount =
    (content.match(/!\[/g) ?? []).length +
    (content.match(/<img\s/gi) ?? []).length;

  /* Calculate total time in minutes */
  const proseMinutes = proseWords / PROSE_WPM;
  const codeMinutes = codeWords / CODE_WPM;
  const imageMinutes = (imageCount * SECONDS_PER_IMAGE) / 60;

  const totalMinutes = Math.max(1, Math.ceil(proseMinutes + codeMinutes + imageMinutes));

  return `${totalMinutes} min read`;
}
