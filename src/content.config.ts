/**
 * Content Collections Configuration — Astro 6 format.
 *
 * Astro 6 requires content config at src/content.config.ts (not src/content/config.ts)
 * and uses file-based loaders (glob) instead of the legacy `type: "content"` approach.
 *
 * Each collection uses glob() to scan Markdown/MDX files in src/content/<collection>/
 * and validates front matter against Zod schemas at build time.
 *
 * Content types:
 *   - posts:    Blog articles (technical notes, theses, essays, dispatches, build logs)
 *   - projects: Research projects with structured or freeform content modes
 *   - teaching: Courses taught or TA'd
 *   - notes:    Digital garden notes with maturity levels (seedling/budding/evergreen)
 *
 * Publications are NOT a Content Collection — they're parsed from bibliography.bib
 * at build time via src/utils/bibtex.ts.
 */

import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/* ── Shared schema fragments ──────────────────────────────────────────────── */

/** ISO date string or Date object, coerced to Date at build time. */
const dateField = z
  .union([z.string(), z.date()])
  .transform((val) => new Date(val));

/** Tag list — lowercase, trimmed, deduplicated at build time. */
const tagsField = z
  .array(z.string().trim().toLowerCase())
  .default([])
  .transform((tags) => [...new Set(tags)]);

/* ── Posts Collection ─────────────────────────────────────────────────────── */

/**
 * Blog posts — maps to the "writing" collection in the old Decap CMS config.
 * Categories match the old site's taxonomy exactly to preserve URL structure.
 */
const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/posts" }),
  schema: z.object({
    title: z.string().min(1, "Post title is required"),
    date: dateField,
    updatedDate: dateField.optional(),
    category: z.enum(["technical", "thesis", "essay", "dispatch", "build-log"]).default("technical"),
    description: z.string().min(1, "Post description is required for SEO"),
    tags: tagsField,
    published: z.boolean().default(false),
    featured: z.boolean().default(false),
    ogImage: z.string().optional(),
    readingTime: z.string().optional(),
  }),
});

/* ── Projects Collection ──────────────────────────────────────────────────── */

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/projects" }),
  schema: z.object({
    title: z.string().min(1, "Project title is required"),
    number: z.string().default("99"),
    date: dateField,
    tags: tagsField,
    highlightTag: z.string().optional(),
    institution: z.string().min(1, "Institution is required"),
    contentMode: z.enum(["structured", "freeform"]).default("structured"),
    problem: z.string().optional(),
    outcomes: z.array(z.string()).default([]),
    impact: z.string().optional(),
    heroImage: z.string().optional(),
    heroCaption: z.string().optional(),
    videoUrl: z.string().url().optional().or(z.literal("")),
    interactiveUrl: z.string().optional(),
    interactiveHeight: z.number().default(500),
    gallery: z
      .array(
        z.object({
          image: z.string(),
          caption: z.string().default(""),
        }),
      )
      .default([]),
    techStack: z.array(z.string()).default([]),
    linkUrl: z.string().optional(),
    linkText: z.string().default("View presentation →"),
    githubUrl: z.string().url().optional().or(z.literal("")),
    /** BibTeX citation keys referencing entries in bibliography.bib */
    relatedPublications: z.array(z.string()).default([]),
    published: z.boolean().default(true),
  }),
});

/* ── Teaching Collection ──────────────────────────────────────────────────── */

const teaching = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/teaching" }),
  schema: z.object({
    title: z.string().min(1, "Course title is required"),
    courseCode: z.string().optional(),
    role: z.enum(["instructor", "ta", "guest-lecturer"]).default("ta"),
    institution: z.string().min(1, "Institution is required"),
    semester: z.string().min(1, "Semester is required (e.g., 'Fall 2025')"),
    year: z.number(),
    description: z.string().default(""),
    tags: tagsField,
    syllabusUrl: z.string().url().optional(),
    published: z.boolean().default(true),
  }),
});

/* ── Notes Collection (Digital Garden) ────────────────────────────────────── */

const notes = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/notes" }),
  schema: z.object({
    title: z.string().min(1, "Note title is required"),
    date: dateField,
    updatedDate: dateField.optional(),
    maturity: z.enum(["seedling", "budding", "evergreen"]).default("seedling"),
    description: z.string().default(""),
    tags: tagsField,
    backlinks: z.array(z.string()).default([]),
    published: z.boolean().default(true),
  }),
});

/* ── Export all collections ───────────────────────────────────────────────── */

export const collections = {
  posts,
  projects,
  teaching,
  notes,
};
