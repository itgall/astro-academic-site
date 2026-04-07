/**
 * schemas.ts — Shared Zod schema fragments.
 *
 * Reusable schema pieces that are imported by content/config.ts
 * and validation utilities. Kept separate for testability.
 */

import { z } from "astro:content";

/** Validates a DOI string format (10.xxxx/yyyy) */
export const doiSchema = z
  .string()
  .regex(/^10\.\d{4,}\/\S+$/, "Invalid DOI format")
  .optional();

/** Validates an arXiv ID format (YYMM.NNNNN or category/YYMMNNN) */
export const arxivSchema = z
  .string()
  .regex(/^(\d{4}\.\d{4,5}|[a-z-]+\/\d{7})$/, "Invalid arXiv ID format")
  .optional();
