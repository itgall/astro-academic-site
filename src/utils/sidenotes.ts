/**
 * sidenotes.ts — Rehype plugin for Tufte-style sidenotes.
 *
 * Transforms standard Markdown footnote HTML into sidenote markup.
 * Uses the traditional Tufte CSS approach: a `<span>` sidenote element
 * placed inline within the text flow, positioned into the margin via CSS
 * `float: right` with negative margins.
 *
 * ── Wide screens (≥80rem) ───────────────────────────────────────────────────
 * Sidenotes float into the right margin, visually aligned with the reference.
 *
 * ── Narrow screens (<80rem) ─────────────────────────────────────────────────
 * Popover API shows footnote content in a modal on click. Zero JS required.
 *
 * ── Graceful degradation ────────────────────────────────────────────────────
 * Original footnotes section preserved as .sidenote-fallback, shown via CSS
 * only when Popover API is unsupported on narrow screens.
 *
 * ── ARIA semantics ──────────────────────────────────────────────────────────
 *   - Superscript: role="doc-noteref", aria-describedby → sidenote ID
 *   - Sidenote:    role="doc-footnote"
 */

import type { Root, Element, ElementContent, Text } from "hast";
import type { Plugin } from "unified";
import { visit, SKIP } from "unist-util-visit";

const SIDENOTE_PREFIX = "sn";

function isElement(node: unknown, tagName?: string): node is Element {
  if (!node || typeof node !== "object") return false;
  const el = node as Record<string, unknown>;
  if (el.type !== "element") return false;
  if (tagName && el.tagName !== tagName) return false;
  return true;
}

function hasClass(el: Element, className: string): boolean {
  const classes = el.properties?.className;
  if (Array.isArray(classes)) return classes.includes(className);
  if (typeof classes === "string") return classes.split(/\s+/).includes(className);
  return false;
}

/**
 * Flatten footnote content into a single text string.
 * Strips all HTML tags (MathJax SVG, links, etc.) and extracts plain text.
 * This ensures the sidenote content is safe for inline placement inside <span>.
 */
function extractPlainText(children: ElementContent[]): string {
  const parts: string[] = [];
  for (const child of children) {
    if (child.type === "text") {
      parts.push((child as Text).value);
    } else if (isElement(child)) {
      if (child.tagName === "a" && hasClass(child, "data-footnote-backref")) {
        continue; /* Skip backref links */
      }
      parts.push(extractPlainText(child.children));
    }
  }
  return parts.join("");
}

/**
 * Remove backref links and extract clean inline children from footnote <li>.
 * Flattens <p> wrappers and strips whitespace-only text nodes.
 * Returns HAST children safe for inline placement.
 */
function extractInlineContent(liChildren: ElementContent[]): ElementContent[] {
  const result: ElementContent[] = [];

  for (const child of liChildren) {
    /* Skip whitespace-only text nodes */
    if (child.type === "text" && (child as Text).value.trim() === "") continue;

    if (isElement(child, "p")) {
      /* Unwrap <p> — extract its inline children */
      for (const pChild of child.children) {
        if (isElement(pChild, "a") && hasClass(pChild, "data-footnote-backref")) continue;
        /* Skip trailing whitespace before backref */
        if (pChild.type === "text" && (pChild as Text).value.trim() === "" &&
            child.children.indexOf(pChild) === child.children.length - 2) continue;
        result.push(pChild);
      }
    } else if (isElement(child, "a") && hasClass(child, "data-footnote-backref")) {
      continue;
    } else {
      result.push(child);
    }
  }

  /* Trim trailing whitespace */
  while (result.length > 0) {
    const last = result[result.length - 1];
    if (last && last.type === "text" && (last as Text).value.trimEnd() !== (last as Text).value) {
      (last as Text).value = (last as Text).value.trimEnd();
      if ((last as Text).value === "") { result.pop(); continue; }
    }
    break;
  }

  return result;
}

/**
 * Deep-clone a HAST subtree via JSON round-trip.
 * This avoids shared references that cause mutation bugs.
 */
function cloneNodes(nodes: ElementContent[]): ElementContent[] {
  return JSON.parse(JSON.stringify(nodes)) as ElementContent[];
}

const rehypeSidenotes: Plugin<[], Root> = function () {
  return function (tree: Root) {
    /* ── Pass 1: Extract footnote content ────────────────────────────── */
    let footnotesSection: Element | null = null;
    let fsSectionIndex = -1;
    let fsSectionParent: { children: ElementContent[] } | null = null;
    const fnContentMap = new Map<string, ElementContent[]>();
    const fnPlainTextMap = new Map<string, string>();

    visit(tree, "element", (node, index, parent) => {
      const el = node as Element;
      if (
        el.tagName === "section" &&
        (el.properties?.dataFootnotes !== undefined || hasClass(el, "footnotes"))
      ) {
        footnotesSection = el;
        fsSectionIndex = index ?? -1;
        fsSectionParent = parent as { children: ElementContent[] } | null;

        for (const child of el.children) {
          if (!isElement(child, "ol")) continue;
          for (const li of child.children) {
            if (!isElement(li, "li")) continue;
            const liId = String(li.properties?.id ?? "");
            const fnNum = liId.replace("user-content-fn-", "");
            if (!fnNum) continue;

            fnContentMap.set(fnNum, extractInlineContent(li.children));
            fnPlainTextMap.set(fnNum, extractPlainText(li.children).trim());
          }
        }
        return SKIP;
      }
    });

    if (fnContentMap.size === 0) return;

    /* ── Pass 2: Replace footnote refs with sidenote markup ──────────── */
    visit(tree, "element", (node, index, parent) => {
      const el = node as Element;
      if (el.tagName !== "sup") return;
      if (!parent || typeof index !== "number") return;
      const parentEl = parent as Element;

      const anchor = el.children.find(
        (c): c is Element =>
          isElement(c, "a") && c.properties?.dataFootnoteRef !== undefined,
      );
      if (!anchor) return;

      const href = String(anchor.properties?.href ?? "");
      const fnNum = href.replace("#user-content-fn-", "");
      const content = fnContentMap.get(fnNum);
      const plainText = fnPlainTextMap.get(fnNum);
      if (!content || !plainText) return;

      const sidenoteId = `${SIDENOTE_PREFIX}-${fnNum}`;
      const popoverId = `${sidenoteId}-popover`;

      /**
       * Strategy: Replace <sup> with TWO siblings:
       * 1. The toggle <label> (inline, stays in text flow)
       * 2. A margin <span class="sidenote"> with ONLY plain text
       *    (avoids block element nesting issues)
       *
       * The popover version uses the full rich content via a <div> placed
       * outside the paragraph by the fallback section.
       */
      const toggleLabel: Element = {
        type: "element",
        tagName: "label",
        properties: {
          className: ["sidenote-toggle"],
          role: "doc-noteref",
          ariaDescribedby: sidenoteId,
          popovertarget: popoverId,
          tabIndex: 0,
        },
        children: [
          {
            type: "element",
            tagName: "sup",
            properties: { className: ["sidenote-number"] },
            children: [],
          },
        ],
      };

      /**
       * Margin sidenote — uses a <span> with only text content.
       * CSS positions this in the right margin on wide screens.
       * Using plain text avoids any block-in-inline HTML serialization issues.
       */
      const marginSidenote: Element = {
        type: "element",
        tagName: "span",
        properties: {
          id: sidenoteId,
          className: ["sidenote"],
          role: "doc-footnote",
        },
        children: [{ type: "text", value: plainText } as Text],
      };

      /**
       * Popover sidenote — uses Popover API for narrow screens.
       * <div popover> is placed in the top layer (outside normal flow),
       * so block content inside is fine.
       */
      const popoverSidenote: Element = {
        type: "element",
        tagName: "div",
        properties: {
          id: popoverId,
          className: ["sidenote-popover"],
          role: "doc-footnote",
          popover: "",
        },
        children: cloneNodes(content),
      };

      /* Replace the <sup> with: toggle + margin sidenote + popover */
      parentEl.children.splice(index, 1, toggleLabel, marginSidenote, popoverSidenote);

      return SKIP;
    });

    /* ── Pass 3: Convert footnotes section to fallback ───────────────── */
    if (footnotesSection && fsSectionParent && fsSectionIndex >= 0) {
      const fsSection = footnotesSection as Element;
      const fsParent = fsSectionParent as { children: ElementContent[] };
      const fallback: Element = {
        type: "element",
        tagName: "section",
        properties: {
          className: ["sidenote-fallback"],
          ariaLabel: "Footnotes",
        },
        children: fsSection.children,
      };
      fsParent.children.splice(fsSectionIndex, 1, fallback as ElementContent);
    }
  };
};

export default rehypeSidenotes;
