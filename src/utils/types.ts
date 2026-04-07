/**
 * types.ts — Shared TypeScript type definitions.
 *
 * Centralized types used across multiple modules to avoid duplication.
 */

/** Publication type categories — mirrors BibTeX entry types */
export type PublicationType =
  | "article"
  | "inproceedings"
  | "misc"
  | "patent"
  | "mastersthesis"
  | "phdthesis"
  | "talk";

/** Publication status values */
export type PublicationStatus =
  | "published"
  | "under-review"
  | "submitted"
  | "accepted"
  | "preprint"
  | "invited"
  | "poster"
  | "granted"
  | "pending";

/** Content maturity levels for the digital garden */
export type MaturityLevel = "seedling" | "budding" | "evergreen";

/** Blog post category values */
export type PostCategory = "technical" | "thesis" | "essay" | "dispatch" | "build-log";

/** Category display labels */
export const categoryLabels: Record<PostCategory, string> = {
  technical: "Technical Note",
  thesis: "Thesis",
  essay: "Essay",
  dispatch: "Dispatch",
  "build-log": "Build Log",
};
