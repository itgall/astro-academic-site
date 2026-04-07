/**
 * wikilinks.ts — Remark plugin for [[wiki-link]] resolution.
 *
 * Transforms [[Note Title]] syntax in Markdown into proper internal links
 * at build time. Resolves against the notes collection by matching titles
 * (case-insensitive) or slugs.
 *
 * Resolution behavior:
 *   - Match found → <a href="/notes/{slug}/" class="wikilink">Note Title</a>
 *   - No match    → <span class="broken-link" title="Page not found">Note Title</span>
 *
 * Supports pipe syntax: [[Note Title|Display Text]]
 *
 * Broken links render as styled text (red dotted underline), NOT as <a> tags.
 * This prevents 404s and provides a clear visual indicator for missing pages.
 *
 * Registered in astro.config.ts under markdown.remarkPlugins.
 */

import type { Root, Text, PhrasingContent } from "mdast";
import type { Plugin } from "unified";
import fs from "node:fs";
import path from "node:path";

/** Pattern matching [[Note Title]] or [[Note Title|Display Text]] */
const WIKILINK_RE = /\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g;

/**
 * Build a lookup map from note titles/slugs to their URL paths.
 * Reads the notes directory at build time to discover available notes.
 *
 * Indexes by both title (case-insensitive) and slug to support
 * both [[My Note Title]] and [[my-note-slug]] syntax.
 */
function buildNoteLookup(): Map<string, { slug: string; title: string }> {
  const lookup = new Map<string, { slug: string; title: string }>();
  const notesDir = path.resolve("src/content/notes");

  if (!fs.existsSync(notesDir)) {
    return lookup;
  }

  const files = fs.readdirSync(notesDir).filter(
    (f) => f.endsWith(".md") || f.endsWith(".mdx"),
  );

  for (const file of files) {
    const content = fs.readFileSync(path.join(notesDir, file), "utf-8");
    const slug = file.replace(/\.(md|mdx)$/, "");

    /** Extract title from YAML frontmatter */
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) continue;

    const titleMatch = frontmatterMatch[1].match(
      /^title:\s*["']?(.+?)["']?\s*$/m,
    );
    if (!titleMatch) continue;

    const title = titleMatch[1];

    /* Index by lowercase title for case-insensitive matching */
    lookup.set(title.toLowerCase(), { slug, title });
    /* Also index by slug for [[slug-based-links]] */
    lookup.set(slug.toLowerCase(), { slug, title });
  }

  return lookup;
}

/**
 * Walk all nodes depth-first, calling visitor on text nodes.
 * Iterates children in reverse so splice operations don't break indices.
 */
function walkText(
  node: unknown,
  parent: unknown,
  index: number | undefined,
  visitor: (
    node: Text,
    index: number,
    parent: { children: PhrasingContent[] },
  ) => void,
): void {
  const n = node as { type?: string; children?: unknown[] };

  if (n.type === "text" && parent && index !== undefined) {
    visitor(
      n as Text,
      index,
      parent as { children: PhrasingContent[] },
    );
  }

  if (Array.isArray(n.children)) {
    for (let i = n.children.length - 1; i >= 0; i--) {
      walkText(n.children[i], node, i, visitor);
    }
  }
}

/** Escape HTML special characters to prevent XSS in span output */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * remarkWikilinks — Remark plugin that resolves [[wiki-link]] syntax.
 *
 * Walks the Markdown AST looking for text nodes containing [[...]] patterns.
 * For each match, looks up the notes collection and replaces with either
 * a proper link node or a styled span for broken links.
 */
const remarkWikilinks: Plugin<[], Root> = () => {
  const lookup = buildNoteLookup();

  return (tree: Root) => {
    walkText(tree, undefined, undefined, (node, index, parent) => {
      if (!node.value.includes("[[")) return;

      const children: PhrasingContent[] = [];
      let lastIndex = 0;

      /* Reset regex state for each node */
      WIKILINK_RE.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = WIKILINK_RE.exec(node.value)) !== null) {
        const linkTarget = match[1].trim();
        const displayText = match[2]?.trim() ?? linkTarget;
        const matchStart = match.index;

        /* Text before this wiki-link */
        if (matchStart > lastIndex) {
          children.push({
            type: "text",
            value: node.value.slice(lastIndex, matchStart),
          });
        }

        /* Resolve the wiki-link against the notes lookup */
        const resolved = lookup.get(linkTarget.toLowerCase());

        if (resolved) {
          /* Found: render as proper internal link with wikilink class */
          children.push({
            type: "link",
            url: `/notes/${resolved.slug}/`,
            title: resolved.title,
            children: [{ type: "text", value: displayText }],
            data: {
              hProperties: { className: ["wikilink"] },
            },
          } as PhrasingContent);
        } else {
          /* Not found: render as styled span — NOT a broken <a> link.
           * Critical: broken links must never produce <a> tags. */
          children.push({
            type: "html",
            value: `<span class="broken-link" title="Page not found: ${escapeHtml(linkTarget)}">${escapeHtml(displayText)}</span>`,
          } as PhrasingContent);
        }

        lastIndex = matchStart + match[0].length;
      }

      /* No matches in this node — skip without modifying the tree */
      if (children.length === 0) return;

      /* Remaining text after the last match */
      if (lastIndex < node.value.length) {
        children.push({
          type: "text",
          value: node.value.slice(lastIndex),
        });
      }

      /* Replace the original text node with the resolved children */
      parent.children.splice(index, 1, ...children);
    });
  };
};

export default remarkWikilinks;
