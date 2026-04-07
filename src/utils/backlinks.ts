/**
 * backlinks.ts — Build-time bidirectional backlink computation.
 *
 * Scans all content collections (posts, projects, notes, teaching) for
 * internal links, builds a reverse map, and exports both a queryable
 * function for page templates and a JSON link graph for the research
 * graph visualization.
 *
 * ── Link detection ──────────────────────────────────────────────────────────
 * 1. Standard Markdown links: [text](/path/) → regex extraction
 * 2. Wiki-links: [[Note Title]] → resolved via note title→slug index
 * 3. HTML links in rendered content: <a href="/..."> (for cross-ref sections)
 *
 * ── Output ──────────────────────────────────────────────────────────────────
 * - getBacklinksForUrl(url): Returns BacklinkEntry[] for a given page URL
 * - getLinkGraph(): Returns the complete LinkGraph for the D3 visualization
 *
 * ── Performance ─────────────────────────────────────────────────────────────
 * Results are computed once and cached for the entire build. Multiple pages
 * calling getBacklinksForUrl() share the same computed map.
 */

import { getCollection, type CollectionEntry } from "astro:content";
import fs from "node:fs";
import path from "node:path";

/* ── Types ───────────────────────────────────────────────────────────────── */

export interface BacklinkEntry {
  /** URL of the page containing the link */
  sourceUrl: string;
  /** Title of the source page */
  sourceTitle: string;
  /** Content type of the source page */
  sourceType: "publication" | "post" | "project" | "note" | "teaching" | "page";
  /** Context snippet — the sentence or paragraph containing the link */
  context: string;
}

export interface GraphNode {
  /** Page URL (serves as unique ID) */
  id: string;
  /** Page title */
  title: string;
  /** Content type */
  type: "publication" | "post" | "project" | "note" | "teaching";
  /** Count of incoming + outgoing links */
  connections: number;
}

export interface GraphEdge {
  /** Source page URL */
  source: string;
  /** Target page URL */
  target: string;
}

export interface LinkGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/* ── Internal types for computation ──────────────────────────────────────── */

interface PageInfo {
  url: string;
  title: string;
  type: GraphNode["type"];
  body: string;
  description: string;
}

/* ── Note title → slug index (mirrors wikilinks.ts resolution) ───────────── */

let noteIndex: Map<string, string> | null = null;

/**
 * Build an index of note titles → URL slugs for wiki-link resolution.
 * Reads the notes content directory and parses frontmatter titles.
 */
function buildNoteIndex(): Map<string, string> {
  if (noteIndex) return noteIndex;
  noteIndex = new Map();

  const notesDir = path.resolve("src/content/notes");
  if (!fs.existsSync(notesDir)) return noteIndex;

  for (const file of fs.readdirSync(notesDir)) {
    if (!file.endsWith(".md") && !file.endsWith(".mdx")) continue;
    const slug = file.replace(/\.(md|mdx)$/, "");
    const content = fs.readFileSync(path.join(notesDir, file), "utf-8");

    /* Extract title from frontmatter */
    const titleMatch = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
    if (titleMatch) {
      const title = titleMatch[1].trim();
      noteIndex.set(title.toLowerCase(), slug);
      noteIndex.set(slug.toLowerCase(), slug);
    }
  }

  return noteIndex;
}

/* ── Link extraction from Markdown body ──────────────────────────────────── */

/**
 * Standard Markdown link pattern: [text](/path/)
 * Captures the URL path from internal links (starting with /).
 */
const MD_LINK_RE = /\[(?:[^\]]*)\]\((\/?[a-z0-9][\w/.-]*\/?)\)/gi;

/**
 * Wiki-link pattern: [[Note Title]] or [[Note Title|Display Text]]
 * Captures the note title for resolution against the note index.
 */
const WIKILINK_RE = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

/**
 * Extract all internal link URLs from a Markdown body.
 * Returns an array of normalized URL paths (e.g., "/blog/my-post/").
 */
function extractLinks(body: string, _pageUrl: string): Array<{ url: string; context: string }> {
  const links: Array<{ url: string; context: string }> = [];
  const seen = new Set<string>();

  /* Standard Markdown links */
  let match: RegExpExecArray | null;
  MD_LINK_RE.lastIndex = 0;
  while ((match = MD_LINK_RE.exec(body)) !== null) {
    const rawUrl = match[1];
    /* Only internal links (starting with /) */
    if (!rawUrl.startsWith("/")) continue;
    /* Skip anchors, images, static files */
    if (rawUrl.includes("#") && !rawUrl.split("#")[0]) continue;
    if (/\.(png|jpg|jpeg|gif|svg|pdf|zip|tar)$/i.test(rawUrl)) continue;

    const normalizedUrl = normalizeUrl(rawUrl);
    if (!seen.has(normalizedUrl)) {
      seen.add(normalizedUrl);
      links.push({ url: normalizedUrl, context: extractContext(body, match.index) });
    }
  }

  /* Wiki-links */
  const noteIdx = buildNoteIndex();
  WIKILINK_RE.lastIndex = 0;
  while ((match = WIKILINK_RE.exec(body)) !== null) {
    const title = match[1].trim();
    const slug = noteIdx.get(title.toLowerCase());
    if (!slug) continue; /* Broken wiki-link — skip */

    const normalizedUrl = `/notes/${slug}/`;
    if (!seen.has(normalizedUrl)) {
      seen.add(normalizedUrl);
      links.push({ url: normalizedUrl, context: extractContext(body, match.index) });
    }
  }

  return links;
}

/**
 * Normalize a URL path: ensure trailing slash, strip anchors.
 */
function normalizeUrl(url: string): string {
  let normalized = url.split("#")[0];
  if (!normalized.endsWith("/")) normalized += "/";
  return normalized;
}

/**
 * Extract a context snippet — the sentence containing the link.
 * Returns ~120 characters centered on the link position.
 */
function extractContext(body: string, matchIndex: number): string {
  /* Find the start of the containing line or paragraph */
  let start = body.lastIndexOf("\n\n", matchIndex);
  if (start === -1) start = 0;
  else start += 2;

  /* Find the end of the containing paragraph */
  let end = body.indexOf("\n\n", matchIndex);
  if (end === -1) end = body.length;

  let snippet = body.slice(start, end).replace(/\n/g, " ").trim();

  /* Strip Markdown formatting for cleaner display */
  snippet = snippet
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") /* [text](url) → text */
    .replace(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g, (_m, title, display) => display ?? title) /* [[a|b]] → b, [[a]] → a */
    .replace(/[*_`#]/g, "") /* bold/italic/code markers */
    .replace(/\$[^$]+\$/g, "[math]") /* inline math */
    .replace(/\s+/g, " ")
    .trim();

  /* Truncate to ~150 chars */
  if (snippet.length > 150) {
    /* Try to cut at a word boundary */
    const cut = snippet.lastIndexOf(" ", 147);
    snippet = snippet.slice(0, cut > 100 ? cut : 147) + "…";
  }

  return snippet;
}

/* ── Build-time computation with caching ─────────────────────────────────── */

let cachedBacklinkMap: Map<string, BacklinkEntry[]> | null = null;
let cachedLinkGraph: LinkGraph | null = null;
let cachedPageInfoMap: Map<string, PageInfo> | null = null;

/**
 * Gather all content pages into a unified PageInfo array.
 */
async function gatherAllPages(): Promise<PageInfo[]> {
  const pages: PageInfo[] = [];

  /* Posts */
  const posts = await getCollection("posts", (p: CollectionEntry<"posts">) => p.data.published !== false);
  for (const post of posts) {
    pages.push({
      url: `/blog/${post.id}/`,
      title: post.data.title,
      type: "post",
      body: post.body ?? "",
      description: post.data.description ?? "",
    });
  }

  /* Projects */
  const projects = await getCollection("projects");
  for (const project of projects) {
    pages.push({
      url: `/projects/${project.id}/`,
      title: project.data.title,
      type: "project",
      body: project.body ?? "",
      description: project.data.description ?? "",
    });
  }

  /* Notes */
  const notes = await getCollection("notes", (n: CollectionEntry<"notes">) => n.data.published !== false);
  for (const note of notes) {
    pages.push({
      url: `/notes/${note.id}/`,
      title: note.data.title,
      type: "note",
      body: note.body ?? "",
      description: note.data.description ?? "",
    });
  }

  /* Teaching */
  const teaching = await getCollection("teaching");
  for (const course of teaching) {
    pages.push({
      url: `/teaching/${course.id}/`,
      title: course.data.title,
      type: "teaching",
      body: course.body ?? "",
      description: course.data.description ?? "",
    });
  }

  return pages;
}

/**
 * Compute the full backlink map and link graph.
 * Called once per build, results cached for all subsequent queries.
 */
async function computeBacklinks(): Promise<void> {
  if (cachedBacklinkMap) return; /* Already computed */

  const pages = await gatherAllPages();

  /* Build page info lookup for quick title/type resolution */
  const pageInfoMap = new Map<string, PageInfo>();
  for (const page of pages) {
    pageInfoMap.set(page.url, page);
  }
  cachedPageInfoMap = pageInfoMap;

  /* Forward link map: source URL → [target URLs] */
  const forwardMap = new Map<string, Array<{ url: string; context: string }>>();
  for (const page of pages) {
    const links = extractLinks(page.body, page.url);
    forwardMap.set(page.url, links);
  }

  /* Reverse map: target URL → BacklinkEntry[] */
  const backlinks = new Map<string, BacklinkEntry[]>();
  for (const [sourceUrl, links] of forwardMap) {
    const sourcePage = pageInfoMap.get(sourceUrl);
    if (!sourcePage) continue;

    for (const { url: targetUrl, context } of links) {
      if (targetUrl === sourceUrl) continue; /* Skip self-links */

      if (!backlinks.has(targetUrl)) {
        backlinks.set(targetUrl, []);
      }
      backlinks.get(targetUrl)!.push({
        sourceUrl,
        sourceTitle: sourcePage.title,
        sourceType: sourcePage.type,
        context,
      });
    }
  }
  cachedBacklinkMap = backlinks;

  /* Build link graph for D3 visualization */
  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  /* Initialize nodes for all pages */
  for (const page of pages) {
    nodeMap.set(page.url, {
      id: page.url,
      title: page.title,
      type: page.type,
      connections: 0,
    });
  }

  /* Build edges and count connections */
  for (const [sourceUrl, links] of forwardMap) {
    for (const { url: targetUrl } of links) {
      if (targetUrl === sourceUrl) continue;
      /* Only include edges where both nodes exist in our content */
      if (!nodeMap.has(targetUrl)) continue;

      edges.push({ source: sourceUrl, target: targetUrl });

      const sourceNode = nodeMap.get(sourceUrl);
      const targetNode = nodeMap.get(targetUrl);
      if (sourceNode) sourceNode.connections++;
      if (targetNode) targetNode.connections++;
    }
  }

  /* Filter to only nodes that have at least one connection */
  const connectedNodes = Array.from(nodeMap.values()).filter(
    (n) => n.connections > 0,
  );

  cachedLinkGraph = { nodes: connectedNodes, edges };
}

/* ── Public API ──────────────────────────────────────────────────────────── */

/**
 * Get all pages that link to the given URL.
 * Returns an empty array if no backlinks exist.
 *
 * @param url — The target page URL (e.g., "/notes/oct-fundamentals/")
 */
export async function getBacklinksForUrl(url: string): Promise<BacklinkEntry[]> {
  await computeBacklinks();
  const normalized = normalizeUrl(url);
  return cachedBacklinkMap?.get(normalized) ?? [];
}

/**
 * Get the complete bidirectional link graph for D3 visualization.
 */
export async function getLinkGraph(): Promise<LinkGraph> {
  await computeBacklinks();
  return cachedLinkGraph ?? { nodes: [], edges: [] };
}

/**
 * Get page info (title, type, description) for a given URL.
 * Used by link preview data generation.
 */
export async function getPageInfo(
  url: string,
): Promise<{ title: string; type: string; description: string } | null> {
  await computeBacklinks();
  const page = cachedPageInfoMap?.get(normalizeUrl(url));
  if (!page) return null;
  return { title: page.title, type: page.type, description: page.description };
}

/**
 * Get all page info for link preview manifest generation.
 */
export async function getAllPageInfo(): Promise<
  Array<{ url: string; title: string; type: string; description: string }>
> {
  await computeBacklinks();
  if (!cachedPageInfoMap) return [];
  return Array.from(cachedPageInfoMap.values()).map((p) => ({
    url: p.url,
    title: p.title,
    type: p.type,
    description: p.description,
  }));
}
