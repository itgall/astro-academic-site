/**
 * linkPreviews.ts — Build-time link preview data generation.
 *
 * Generates a JSON manifest of page metadata (title, description, type)
 * for all content pages. This manifest is embedded in BaseLayout as a
 * <script type="application/json"> block, consumed by the LinkPreview
 * React island to show hover/focus previews on internal links.
 *
 * Uses the backlinks utility's getAllPageInfo() to avoid duplicate
 * content scanning — both systems share the same build-time computation.
 */

import { getAllPageInfo } from "./backlinks";

export interface LinkPreviewEntry {
  /** Page URL */
  url: string;
  /** Page title */
  title: string;
  /** Content type badge label */
  type: string;
  /** First ~150 chars of description */
  description: string;
}

/**
 * Generate the link preview manifest for all content pages.
 * Returns a serializable array suitable for JSON embedding.
 */
export async function generateLinkPreviewManifest(): Promise<LinkPreviewEntry[]> {
  const pages = await getAllPageInfo();

  return pages.map((p) => ({
    url: p.url,
    title: p.title,
    type: p.type,
    description: p.description.length > 150
      ? p.description.slice(0, 147) + "…"
      : p.description,
  }));
}
