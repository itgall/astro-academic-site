/**
 * bibtex.ts — Core BibTeX Parser (Fully Typed).
 *
 * Parser: @retorquere/bibtex-parser v9
 *   - Handles LaTeX-encoded characters, all BibTeX entry types, robust
 *     error recovery, active maintenance, used by Zotero.
 *   - Chosen over bibtex-js-parser (lacks LaTeX decoding, weaker error handling).
 *
 * This module is the SINGLE SOURCE OF TRUTH for publication data
 * (Governing Principle #6). One .bib file → individual pages with Highwire
 * Press meta tags, JSON-LD ScholarlyArticle, and filterable listing views.
 *
 * @module
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import slugify from "slugify";
import { cleanLatex } from "./latex";

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface Author {
  first: string;
  last: string;
  /** "First Last" display format */
  full: string;
}

export type PubType =
  | "article"
  | "inproceedings"
  | "book"
  | "phdthesis"
  | "mastersthesis"
  | "misc"
  | "incollection"
  | "techreport";

export interface Publication {
  /** BibTeX citation key */
  key: string;
  type: PubType;
  /** LaTeX-cleaned title */
  title: string;
  authors: Author[];
  year: number;
  month?: string;
  journal?: string;
  booktitle?: string;
  publisher?: string;
  volume?: string;
  number?: string;
  pages?: string;
  /** Parsed from pages "123--456" */
  firstpage?: string;
  /** Parsed from pages "123--456" */
  lastpage?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  keywords?: string[];
  /** Custom BibTeX field: file or pdf */
  pdfPath?: string;
  /** Parsed from eprint, arxivid, or arxiv.org URL */
  arxivId?: string;
  issn?: string;
  isbn?: string;
  /** URL-safe key for routing */
  slug: string;
  /** Original BibTeX entry for copy-to-clipboard */
  bibtexRaw: string;
  /** Custom field: status (published, under-review, preprint, etc.) */
  status?: string;
  /** Custom field: code repository URL */
  codeUrl?: string;
  /** Custom field: slides file path */
  slides?: string;
  /** Custom field: poster file path */
  poster?: string;
  /** Institution (for theses, tech reports) */
  institution?: string;
}

/* ── Parser internals ─────────────────────────────────────────────────────── */

/**
 * Shape of author objects returned by @retorquere/bibtex-parser.
 * The parser returns different shapes for personal vs. organizational authors.
 */
interface ParsedAuthor {
  firstName?: string;
  lastName?: string;
  prefix?: string;
  suffix?: string;
  name?: string;       /* organizational author or literal */
  literal?: string;    /* alternate form for organizational author */
}

/** Shape of a parsed BibTeX entry from the parser. */
interface ParsedEntry {
  type: string;
  key: string;
  fields: Record<string, unknown>;
  input: string;
}

/** Valid PubType values for type narrowing. */
const VALID_PUB_TYPES = new Set<string>([
  "article", "inproceedings", "book", "phdthesis", "mastersthesis",
  "misc", "incollection", "techreport",
]);

/**
 * Safely extract a string value from a BibTeX field.
 * Handles strings, arrays (joined), and objects with a .value property.
 */
function fieldStr(fields: Record<string, unknown>, key: string): string {
  const val = fields[key];
  if (!val) return "";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) {
    return val
      .map((v: unknown) => {
        if (typeof v === "string") return v;
        if (v && typeof v === "object" && "value" in v) return String((v as Record<string, unknown>).value);
        return String(v);
      })
      .join(" ");
  }
  return String(val);
}

/**
 * Extract and normalize authors from the parser's author field.
 * Handles personal names (with prefix like "van der"), organizational
 * authors ({National Institutes of Health}), and "and others" / "et al."
 */
function extractAuthors(fields: Record<string, unknown>): Author[] {
  const raw = fields.author;
  if (!raw) return [];

  /* The parser returns an array of author objects */
  const list = Array.isArray(raw) ? raw : [raw];
  const authors: Author[] = [];

  for (const a of list as ParsedAuthor[]) {
    if (!a || typeof a !== "object") continue;

    /* Organizational author: { name: "..." } or { literal: "..." } */
    if (a.name || a.literal) {
      const name = cleanLatex(String(a.name ?? a.literal));
      authors.push({ first: "", last: name, full: name });
      continue;
    }

    /* Skip "Others" / "et al." as a standalone final author */
    const lastName = a.lastName ?? "";
    if (/^(others|et\s*al\.?)$/i.test(lastName) && !a.firstName) {
      authors.push({ first: "", last: "et al.", full: "et al." });
      continue;
    }

    /* Personal author with optional prefix (von, de, van der) */
    const first = cleanLatex(a.firstName ?? "");
    const prefix = a.prefix ? cleanLatex(a.prefix) : "";
    const last = cleanLatex(lastName);
    const suffix = a.suffix ? cleanLatex(a.suffix) : "";

    /* Build full last name: "van der Berg" */
    const fullLast = [prefix, last].filter(Boolean).join(" ");
    /* Build display name: "Lars van der Berg" or "Lars van der Berg, Jr." */
    const fullParts = [first, fullLast, suffix ? `, ${suffix}` : ""].filter(Boolean);
    const full = fullParts.join(" ").replace(/\s+/g, " ").trim();

    authors.push({ first, last: fullLast, full });
  }

  return authors;
}

/**
 * Parse pages field "123--456" or "123-456" or "123–456" into first/last.
 * Returns [firstpage, lastpage] or [pages, undefined] if no separator.
 */
function parsePages(pages: string): [string | undefined, string | undefined] {
  if (!pages) return [undefined, undefined];
  /* Try em-dash, double-dash, en-dash, or single-dash separators */
  const match = pages.match(/^(\d+)\s*(?:--|–|—|-)\s*(\d+)$/);
  if (match) return [match[1], match[2]];
  /* Single page or non-standard format */
  return [pages.trim(), undefined];
}

/**
 * Extract arXiv ID from eprint, arxivid, arxiv fields, or URL.
 */
function extractArxivId(fields: Record<string, unknown>): string | undefined {
  const eprint = fieldStr(fields, "eprint");
  if (eprint && /^\d{4}\.\d{4,5}/.test(eprint)) return eprint;

  const arxivid = fieldStr(fields, "arxivid") || fieldStr(fields, "arxiv");
  if (arxivid) return arxivid;

  /* Check URL for arxiv.org pattern */
  const url = fieldStr(fields, "url");
  const urlMatch = url.match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5}(?:v\d+)?)/);
  if (urlMatch) return urlMatch[1];

  return undefined;
}

/**
 * Generate a URL-safe slug from a BibTeX key.
 * Uses the slugify library with strict mode for maximum compatibility.
 */
function makeSlug(key: string): string {
  return slugify(key, { lower: true, strict: true });
}

/* ── Public API ───────────────────────────────────────────────────────────── */

/**
 * Parse the bibliography.bib file and return typed Publication objects.
 *
 * Returns publications sorted reverse-chronologically by year.
 * Malformed entries are skipped with a console warning (never crashes the build).
 *
 * Uses dynamic import for the parser to avoid ESM/CJS issues at build time.
 */
export async function parseBibliography(): Promise<Publication[]> {
  const bibPath = join(process.cwd(), "src", "data", "bibliography.bib");
  let bibContent: string;

  try {
    bibContent = readFileSync(bibPath, "utf-8");
  } catch {
    console.warn("[bibtex] bibliography.bib not found — returning empty array");
    return [];
  }

  /* Skip if no entries present */
  if (!/@\w+\s*\{/.test(bibContent)) return [];

  const { parse: parseBibtex } = await import("@retorquere/bibtex-parser");
  const parsed = parseBibtex(bibContent, {
    sentenceCase: false,    /* Preserve original title casing */
  });

  const publications: Publication[] = [];

  for (const raw of parsed.entries as ParsedEntry[]) {
    try {
      const fields = raw.fields;
      const key = raw.key ?? "unknown";
      const rawType = raw.type?.toLowerCase() ?? "misc";
      const type: PubType = VALID_PUB_TYPES.has(rawType)
        ? (rawType as PubType)
        : "misc";

      const title = cleanLatex(fieldStr(fields, "title"));
      const yearStr = fieldStr(fields, "year");
      const year = parseInt(yearStr, 10);

      /* Skip entries missing required fields */
      if (!title || isNaN(year)) {
        console.warn(`[bibtex] Skipping entry "${key}": missing title or year`);
        continue;
      }

      const authors = extractAuthors(fields);
      const pagesRaw = fieldStr(fields, "pages");
      const [firstpage, lastpage] = parsePages(pagesRaw);

      /* Parse keywords: split on comma or semicolon */
      let keywords: string[] | undefined;
      const kw = fields.keywords;
      if (Array.isArray(kw) && kw.length > 0) {
        keywords = kw.map((k: unknown) => String(k).trim()).filter(Boolean);
      } else {
        const kwStr = fieldStr(fields, "keywords");
        if (kwStr) {
          keywords = kwStr
            .split(/[,;]/)
            .map((k) => k.trim())
            .filter(Boolean);
        }
      }

      const pub: Publication = {
        key,
        type,
        title,
        authors,
        year,
        month: fieldStr(fields, "month") || undefined,
        journal: cleanLatex(fieldStr(fields, "journal")) || undefined,
        booktitle: cleanLatex(fieldStr(fields, "booktitle")) || undefined,
        publisher: fieldStr(fields, "publisher") || undefined,
        volume: fieldStr(fields, "volume") || undefined,
        number: fieldStr(fields, "number") || fieldStr(fields, "issue") || undefined,
        pages: pagesRaw || undefined,
        firstpage,
        lastpage,
        doi: fieldStr(fields, "doi") || undefined,
        url: fieldStr(fields, "url") || undefined,
        abstract: cleanLatex(fieldStr(fields, "abstract")) || undefined,
        keywords,
        pdfPath: fieldStr(fields, "pdf") || fieldStr(fields, "file") || undefined,
        arxivId: extractArxivId(fields),
        issn: fieldStr(fields, "issn") || undefined,
        isbn: fieldStr(fields, "isbn") || undefined,
        slug: makeSlug(key),
        bibtexRaw: raw.input ?? `@${type}{${key}}`,
        status: fieldStr(fields, "status") || undefined,
        codeUrl: fieldStr(fields, "code") || undefined,
        slides: fieldStr(fields, "slides") || undefined,
        poster: fieldStr(fields, "poster") || undefined,
        institution: fieldStr(fields, "institution") || fieldStr(fields, "school") || undefined,
      };

      publications.push(pub);
    } catch (err) {
      console.warn(`[bibtex] Error processing entry: ${String(err)}`);
    }
  }

  /* Sort reverse-chronologically by year, then alphabetically by key */
  publications.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return a.key.localeCompare(b.key);
  });

  return publications;
}

/**
 * Format an author list for display. If highlightName is provided,
 * the matching author is wrapped in <strong> tags for visual emphasis.
 *
 * Name matching is flexible: handles middle initials by checking if
 * the author's last name matches AND the first name starts with the
 * highlight name's first name (e.g., "Your Name" matches
 * "Jane A. Doe").
 */
export function formatAuthors(authors: Author[], highlightName?: string): string {
  if (authors.length === 0) return "";

  /**
   * Check if an author matches the highlight name.
   * Handles: exact match, middle initials, and partial first names.
   */
  function isHighlighted(author: Author): boolean {
    if (!highlightName) return false;
    const display = (author.full || `${author.first} ${author.last}`.trim()).toLowerCase();
    const target = highlightName.toLowerCase();

    /* Exact substring match */
    if (display.includes(target)) return true;

    /* Split-based match: last name must match, first name must start with target first */
    const targetParts = target.split(/\s+/);
    if (targetParts.length >= 2) {
      const targetFirst = targetParts[0];
      const targetLast = targetParts[targetParts.length - 1];
      const authorLast = author.last.toLowerCase();
      const authorFirst = author.first.toLowerCase();
      if (
        authorLast.includes(targetLast) &&
        authorFirst.startsWith(targetFirst)
      ) {
        return true;
      }
    }

    return false;
  }

  const names = authors.map((a) => {
    const display = a.full || `${a.first} ${a.last}`.trim();
    if (isHighlighted(a)) {
      return `<strong>${display}</strong>`;
    }
    return display;
  });

  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

/**
 * Format a citation string in the specified style.
 *
 * Styles:
 *   - apa: Author (Year). Title. *Journal*, vol(num), pages. https://doi.org/...
 *   - ieee: [key] Author, "Title," *Journal*, vol. X, no. Y, pp. Z, Year.
 *   - bibtex: Returns the raw BibTeX entry.
 */
export function formatCitation(
  pub: Publication,
  style: "apa" | "ieee" | "bibtex",
): string {
  if (style === "bibtex") return pub.bibtexRaw;

  const authorStr = pub.authors.map((a) => a.full).join(", ");
  const venue = pub.journal ?? pub.booktitle ?? "";

  if (style === "apa") {
    const parts: string[] = [];

    /* Authors */
    const apaAuthors = pub.authors
      .map((a) => {
        if (!a.first) return a.last;
        const initials = a.first
          .split(/\s+/)
          .map((n) => `${n[0]}.`)
          .join(" ");
        return `${a.last}, ${initials}`;
      })
      .join(", ");
    parts.push(`${apaAuthors} (${pub.year}).`);

    /* Title */
    parts.push(`${pub.title}.`);

    /* Venue */
    if (venue) {
      let venueStr = venue;
      if (pub.volume) {
        venueStr += `, ${pub.volume}`;
        if (pub.number) venueStr += `(${pub.number})`;
      }
      if (pub.pages) venueStr += `, ${pub.pages}`;
      parts.push(`${venueStr}.`);
    }

    /* DOI */
    if (pub.doi) parts.push(`https://doi.org/${pub.doi}`);

    return parts.join(" ");
  }

  /* IEEE style */
  const parts: string[] = [];
  parts.push(`${authorStr},`);
  parts.push(`"${pub.title},"`);
  if (venue) {
    let venueStr = venue;
    if (pub.volume) venueStr += `, vol. ${pub.volume}`;
    if (pub.number) venueStr += `, no. ${pub.number}`;
    if (pub.pages) venueStr += `, pp. ${pub.pages}`;
    venueStr += `, ${pub.year}.`;
    parts.push(venueStr);
  }
  if (pub.doi) parts.push(`doi: ${pub.doi}`);

  return parts.join(" ");
}

/**
 * Return the original BibTeX entry for a publication.
 * Convenience wrapper for direct access.
 */
export function getRawBibtex(pub: Publication): string {
  return pub.bibtexRaw;
}

/**
 * Format a date for Google Scholar's citation_publication_date meta tag.
 * Returns "YYYY/MM/DD" if month is available, otherwise "YYYY".
 *
 * Google Scholar accepts: YYYY, YYYY/MM, YYYY/MM/DD
 */
export function formatScholarDate(year: number, month?: string): string {
  if (!month) return String(year);

  /* Parse month name or number */
  const MONTH_MAP: Record<string, string> = {
    jan: "01", january: "01", feb: "02", february: "02",
    mar: "03", march: "03", apr: "04", april: "04",
    may: "05", jun: "06", june: "06",
    jul: "07", july: "07", aug: "08", august: "08",
    sep: "09", september: "09", oct: "10", october: "10",
    nov: "11", november: "11", dec: "12", december: "12",
  };

  const cleaned = month.toLowerCase().replace(/[{}]/g, "").trim();
  const mm = MONTH_MAP[cleaned] ?? (cleaned.match(/^\d{1,2}$/) ? cleaned.padStart(2, "0") : undefined);

  return mm ? `${year}/${mm}` : String(year);
}

/** Group publications by year for listing display. */
export function groupByYear(pubs: Publication[]): Map<number, Publication[]> {
  const groups = new Map<number, Publication[]>();
  for (const pub of pubs) {
    const existing = groups.get(pub.year);
    if (existing) {
      existing.push(pub);
    } else {
      groups.set(pub.year, [pub]);
    }
  }
  return groups;
}

/**
 * Human-readable label for a publication type.
 */
export function pubTypeLabel(type: PubType): string {
  const labels: Record<PubType, string> = {
    article: "Journal Article",
    inproceedings: "Conference Paper",
    book: "Book",
    phdthesis: "PhD Thesis",
    mastersthesis: "Master's Thesis",
    misc: "Preprint / Other",
    incollection: "Book Chapter",
    techreport: "Technical Report",
  };
  return labels[type] ?? type;
}
