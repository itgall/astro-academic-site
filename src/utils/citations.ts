/**
 * citations.ts — Citation formatting utilities.
 *
 * Re-exports citation-related functions from bibtex.ts for convenient
 * importing. The core implementation lives in bibtex.ts as the single
 * source of truth (Governing Principle #6).
 *
 * @module
 */

export {
  formatCitation,
  formatAuthors,
  formatScholarDate,
  getRawBibtex,
} from "./bibtex";
