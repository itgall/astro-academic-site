/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Astro Academic Site — Master Configuration
 *
 * Production-grade academic website template built on Astro 6.
 * Zero JS by default, BibTeX-driven publications, Pagefind search,
 * Tufte sidenotes, bidirectional backlinks, research graph.
 *
 * See ARCHITECTURE.md for full documentation of design decisions,
 * feature flags, content authoring guide, and deployment instructions.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
/**
 * Note: @astrojs/cloudflare adapter is installed but NOT configured here.
 * For pure static output (SSG), no adapter is needed. The adapter is only
 * required if switching to SSR (output: 'server' or 'hybrid') in the future.
 * Cloudflare Pages serves static files directly from dist/.
 */
import tailwindcss from "@tailwindcss/vite";
import remarkMath from "remark-math";
import remarkWikilinks from "./src/utils/wikilinks";
import rehypeMathjax from "rehype-mathjax";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSidenotes from "./src/utils/sidenotes";

/**
 * Astro 6 master configuration.
 *
 * Tailwind CSS 4 integration: Uses @tailwindcss/vite plugin directly rather than
 * @astrojs/tailwind, which does not yet support Astro 6. The Vite plugin approach
 * is the canonical method for Tailwind CSS 4's CSS-first configuration.
 *
 * Output: Pure static site generation (SSG). No server-side rendering.
 * Every page is pre-rendered at build time for maximum performance and
 * compatibility with Cloudflare Pages' free tier.
 */
export default defineConfig({
  site: "https://your-domain.com",
  output: "static",

  integrations: [
    /**
     * MDX: Enables embedded React/Svelte components in blog posts.
     * Only posts that import components ship JS; pure Markdown posts remain zero-JS.
     */
    mdx(),

    /**
     * Sitemap: Auto-generates sitemap.xml at build time from all static routes.
     * Excludes admin/CMS pages. Submitted to Google Search Console for indexing.
     */
    sitemap({
      filter: (page) => !page.includes("/admin"),
    }),

    /**
     * React: Enables React Islands for interactive components (ThemeToggle,
     * SearchWidget, ResearchGraph, CopyButton, LinkPreview). Each Island
     * hydrates independently — no global React runtime.
     */
    react(),
  ],

  /**
   * Vite configuration: Tailwind CSS 4 via its official Vite plugin.
   * This replaces the @astrojs/tailwind integration which is incompatible with Astro 6.
   */
  vite: {
    plugins: [tailwindcss()],
  },

  markdown: {
    /**
     * Remark plugins: Process Markdown AST before HTML conversion.
     * - remark-math: Parses $...$ (inline) and $$...$$ (display) math delimiters
     *   into math AST nodes.
     */
    remarkPlugins: [remarkMath, remarkWikilinks],

    /**
     * Rehype plugins: Process HTML AST after Markdown conversion.
     *
     * rehype-mathjax: Renders math nodes to MathJax HTML at build time.
     * KaTeX has zero accessibility support — screen readers cannot read its
     * output. MathJax 4.x provides built-in speech generation, keyboard
     * navigation of sub-expressions, Braille output, and screen reader
     * compatibility via aria-label attributes on rendered math elements.
     *
     * rehype-slug: Adds id attributes to headings for deep linking.
     * rehype-autolink-headings: Wraps heading text in anchor links.
     * rehype-sidenotes: Transforms footnotes into Tufte-style margin notes.
     */
    rehypePlugins: [
      rehypeMathjax,
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
          properties: {
            className: ["heading-anchor"],
            ariaLabel: "Link to this section",
          },
        },
      ],

      /**
       * rehype-sidenotes: Transforms standard footnote HTML into Tufte-style
       * sidenotes. Must run AFTER all other rehype plugins that might produce
       * or modify footnote markup. Uses Popover API for narrow screen fallback.
       */
      rehypeSidenotes,
    ],

    /**
     * Shiki syntax highlighting: Built into Astro, no additional dependency.
     * github-dark-default chosen to complement the dark-first design aesthetic.
     */
    shikiConfig: {
      themes: {
        light: "github-light-default",
        dark: "github-dark-default",
      },
    },
  },

  /**
   * Redirects: Preserve old URL patterns from the Eleventy site.
   * Maps /research/ → /publications/ and /writing/ → /blog/ for SEO continuity.
   */
  redirects: {
    "/research": "/publications",
    "/research/[...slug]": "/publications/[...slug]",
    "/writing": "/blog",
    "/writing/[...slug]": "/blog/[...slug]",
  },
});
