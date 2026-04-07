# ARCHITECTURE.md — Astro Academic Site

> Definitive reference document for the Astro 6 academic website.
> Generated after Session 7 of 7 (Infrastructure, Content Migration, Final Integration).
> Date: 2026-04-05

---

## 1. File Listing

Every file in the project, organized by directory. Line counts are approximate.

### Root

| File | Lines | Purpose |
|------|------:|---------|
| `astro.config.ts` | 288 | Master Astro configuration: plugins, markdown pipeline, redirects, Vite/Tailwind setup |
| `keystatic.config.ts` | 183 | Keystatic CMS schema mirroring Content Collection Zod schemas (local mode) |
| `package.json` | 62 | Dependencies, npm scripts, engine requirements |
| `tsconfig.json` | 21 | TypeScript strict mode config extending Astro's base |
| `tailwind.css` | 361 | Tailwind CSS 4 entrypoint: theme tokens, custom properties, component layers |
| `netlify.toml` | 62 | Netlify deployment config with security headers and redirects |
| `vercel.json` | 38 | Vercel deployment config with security headers and redirects |
| `README.md` | 108 | Project overview, quickstart, scripts reference, content management guide |
| `LICENSE` | 21 | MIT license |
| `.gitignore` | 30 | Build output, deps, cache, IDE, OS files |

### `.github/workflows/`

| File | Lines | Purpose |
|------|------:|---------|
| `build-deploy.yml` | 55 | CI/CD: build + Pagefind + deploy to Cloudflare Pages on push to main |
| `quality-gates.yml` | 169 | PR checks: TypeScript, build, lychee link check, Pa11y a11y, Lighthouse CI |
| `weekly-refresh.yml` | 46 | Cron (Sunday midnight UTC): fetch Semantic Scholar citation counts, auto-commit |
| `gh-pages.yml` | 64 | Alternative deployment to GitHub Pages via actions/deploy-pages |

### `public/`

| File | Lines | Purpose |
|------|------:|---------|
| `favicon.svg` | 4 | SVG favicon |
| `robots.txt` | 11 | Crawler directives: allow all, disallow Keystatic admin, noai/noimageai |
| `_headers` | 23 | Cloudflare Pages security headers and cache-control rules |
| `fonts/` | — | Directory for self-hosted WOFF2 font files (IBM Plex family) |

### `scripts/`

| File | Lines | Purpose |
|------|------:|---------|
| `new-post.ts` | 30 | CLI scaffolding: creates `src/content/posts/{slug}.md` with frontmatter template |
| `new-project.ts` | 30 | CLI scaffolding: creates `src/content/projects/{slug}.md` with frontmatter |
| `new-note.ts` | 28 | CLI scaffolding: creates `src/content/notes/{slug}.md` with `maturity: seedling` |
| `refresh-citations.ts` | 173 | Semantic Scholar API client: extracts DOIs from .bib, fetches citation counts, writes `citations.json` |

### `src/components/` — Astro components (zero client-side JS)

| File | Lines | Purpose |
|------|------:|---------|
| `Backlinks.astro` | 52 | Renders bidirectional backlink panel with `data-pagefind-ignore` |
| `Callout.astro` | 18 | Styled callout/admonition block (info, warning, tip variants) |
| `CitationActions.astro` | 135 | BibTeX copy/download buttons on publication pages |
| `ContentMaturity.astro` | 31 | Maturity badge: seedling 🌱, budding 🌿, evergreen 🌳 |
| `Figure.astro` | 18 | Semantic `<figure>` with caption |
| `Footer.astro` | 91 | Site footer with social links, nav, affiliations, `data-pagefind-ignore` |
| `Head.astro` | 134 | `<head>` content: meta tags, Open Graph, Twitter Cards, preconnects, fonts |
| `Nav.astro` | 151 | Responsive nav with mobile hamburger, frosted-glass backdrop, skip-to-content |
| `NoteCard.astro` | 66 | Note listing card with maturity badge and tag chips |
| `PostCard.astro` | 77 | Blog post listing card with category, date, reading time |
| `ProjectCard.astro` | 57 | Project listing card with institution and tech stack |
| `PubCard.astro` | 126 | Publication card with inline abstract toggle and BibTeX copy |
| `PubList.astro` | 42 | Grouped publication listing by year |
| `ScholarMeta.astro` | 66 | Highwire Press meta tags for Google Scholar indexing |
| `SEO.astro` | 137 | Centralized JSON-LD structured data (BlogPosting, CreativeWork, Article) |
| `Sidenote.astro` | 18 | Tufte-style margin note component |
| `TOC.astro` | 74 | Table of contents with heading hierarchy extraction |

### `src/islands/` — React components (hydrated via Astro Islands)

| File | Lines | Purpose | Hydration |
|------|------:|---------|-----------|
| `CopyButton.tsx` | 60 | BibTeX/citation copy-to-clipboard | `client:idle` — non-critical interaction |
| `LinkPreview.tsx` | 193 | Hover/focus link preview popover | `client:idle` — enhancement, not essential |
| `ResearchGraph.tsx` | 546 | D3 force-directed knowledge graph | `client:load` — primary content on /graph/ |
| `SearchWidget.tsx` | 308 | Pagefind search with filter chips | `client:load` — primary content on /search/ |
| `ThemeToggle.tsx` | 126 | Dark/light/system theme toggle | `client:load` — prevents FOUC |

### `src/layouts/`

| File | Lines | Purpose |
|------|------:|---------|
| `BaseLayout.astro` | 143 | Root layout: Head, Nav, Footer, skip-to-content, View Transitions |
| `NoteLayout.astro` | 89 | Note detail: maturity badge, backlinks, Article JSON-LD |
| `PageLayout.astro` | 45 | List page wrapper: title + description + content slot |
| `PostLayout.astro` | 109 | Blog post: TOC, reading time, backlinks, BlogPosting JSON-LD |
| `ProjectLayout.astro` | 117 | Project detail: cross-referenced pubs, backlinks, CreativeWork JSON-LD |
| `PublicationLayout.astro` | 203 | Publication: ScholarMeta, CitationActions, backlinks, ScholarlyArticle JSON-LD |

### `src/pages/`

| File | Lines | Purpose |
|------|------:|---------|
| `index.astro` | 221 | Homepage: hero, about, featured publications, recent posts |
| `404.astro` | 47 | Custom 404 page |
| `about.astro` | 143 | About page: bio, experience, education, research interests |
| `contact.astro` | 141 | Contact page with email, social links, institutional info |
| `cv.astro` | 432 | CV page: renders from cv.yaml, print-optimized, Person JSON-LD |
| `graph.astro` | 36 | Research graph: ResearchGraph island wrapper |
| `search.astro` | 76 | Search page: SearchWidget island, noscript fallback, SearchAction JSON-LD |
| `rss.xml.ts` | 32 | RSS feed generation from blog posts |
| `blog/index.astro` | 64 | Blog listing with category filters |
| `blog/[...slug].astro` | 40 | Blog post detail (delegates to PostLayout) |
| `blog/tags/[tag].astro` | 46 | Posts filtered by tag |
| `notes/index.astro` | 40 | Notes listing with maturity indicators |
| `notes/[...slug].astro` | 21 | Note detail (delegates to NoteLayout) |
| `projects/index.astro` | 32 | Projects listing |
| `projects/[...slug].astro` | 21 | Project detail (delegates to ProjectLayout) |
| `publications/index.astro` | 157 | Publications listing: grouped by year, type filter, abstract toggle |
| `publications/[...slug].astro` | 37 | Publication detail (delegates to PublicationLayout) |
| `teaching/index.astro` | 60 | Teaching listing |
| `teaching/[...slug].astro` | 100 | Teaching detail with Course JSON-LD |

### `src/data/`

| File | Lines | Purpose |
|------|------:|---------|
| `bibliography.bib` | 174 | BibTeX source of truth: 11 publications with DOIs, abstracts, custom fields |
| `citations.json` | 1 | Citation count cache populated by `refresh-citations.ts` |
| `cv.yaml` | 108 | Structured CV data: education, experience, research, teaching, skills, awards |
| `meta.ts` | 135 | Typed site metadata: name, role, affiliations, contact, social links |
| `navigation.ts` | 57 | Primary nav, footer nav, and social link definitions |
| `orcid.ts` | 266 | Build-time ORCID API fetch with 24h file cache (not yet wired into pages) |

### `src/utils/`

| File | Lines | Purpose |
|------|------:|---------|
| `backlinks.ts` | 402 | Computes bidirectional backlinks across all content collections |
| `bibtex.ts` | 524 | Core BibTeX parser: .bib → typed `Publication[]` with LaTeX cleaning |
| `citations.ts` | 16 | Re-exports citation formatting functions from bibtex.ts |
| `contentMaturity.ts` | 64 | Maturity level metadata (label, emoji, description, color) |
| `dates.ts` | 64 | Date formatting utilities (ISO, display, relative) |
| `latex.ts` | 166 | LaTeX special character → Unicode cleaning |
| `linkPreviews.ts` | 41 | Link preview data generation for the LinkPreview island |
| `readingTime.ts` | 59 | Reading time estimation with word count |
| `schemas.ts` | 20 | Shared Zod schema fragments |
| `sidenotes.ts` | 259 | Rehype plugin: transforms footnotes → Tufte-style sidenotes |
| `types.ts` | 42 | Shared TypeScript type definitions |
| `wikilinks.ts` | 188 | Remark plugin: parses `[[wiki-links]]` → note cross-references |

### `src/styles/`

| File | Lines | Purpose |
|------|------:|---------|
| `global.css` | 350 | Base styles, CSS custom properties, typography, component imports |
| `print.css` | 245 | Print stylesheet for CV and publication pages |
| `sidenote.css` | 178 | Sidenote layout: margin positioning, popover fallback, reduced-motion |
| `components/callout.css` | 5 | Callout component styles |
| `components/graph.css` | 5 | Research graph container styles |
| `components/nav.css` | 5 | Nav component styles |
| `components/pub-card.css` | 243 | Publication card: abstract toggle, citation actions, type badges |
| `components/search.css` | 220 | Search widget: filter chips, result cards, Pagefind mark highlights |

### `src/content/` — Markdown content files

| File | Lines | Purpose |
|------|------:|---------|
| `content.config.ts` | 137 | Content Collection schemas (Zod) for posts, projects, teaching, notes |
| `posts/inverse-spectroscopic-oct.md` | 108 | Technical post on spectroscopic OCT inverse algorithms |
| `posts/jones-matrix-simulator.md` | 180 | Build log for fiber-optic Jones matrix simulation |
| `posts/physicists-medical-instruments.md` | 47 | Essay on physicists building medical instruments |
| `projects/nir-ii-photoacoustic.md` | 38 | NIR-II photoacoustic imaging project |
| `projects/spectroscopic-ivoct.md` | 47 | Spectroscopic IV-OCT project |
| `teaching/phgn320-optics.md` | 33 | PHGN 320 Optics TA entry |
| `teaching/phgn462-advanced-optics.md` | 28 | PHGN 462 Advanced Optics TA entry |
| `notes/fellgett-advantage.md` | 25 | Note: Fellgett's advantage in spectroscopy |
| `notes/inverse-problems-optical.md` | 36 | Note: Inverse problems in optical systems |
| `notes/jones-calculus-fiber.md` | 38 | Note: Jones calculus for fiber optics |
| `notes/oct-fundamentals.md` | 36 | Note: OCT fundamentals |

---

## 2. Dependencies

### Production Dependencies

| Package | Version | Purpose | Justification |
|---------|---------|---------|---------------|
| `astro` | ^6.1.3 | Framework | Zero-JS-default static site generator. Content Collections with Zod validation. View Transitions. |
| `@astrojs/mdx` | ^5.0.3 | MDX support | Enables React component embedding in Markdown posts |
| `@astrojs/react` | ^5.0.2 | React integration | Island hydration for interactive components (search, graph, theme toggle) |
| `@astrojs/rss` | ^4.0.18 | RSS generation | Generates `/rss.xml` from blog posts |
| `@astrojs/sitemap` | ^3.7.2 | Sitemap | Auto-generates `sitemap-index.xml` at build time |
| `@astrojs/cloudflare` | ^13.1.7 | Cloudflare adapter | Installed but not active (static output). Required only if switching to SSR. Could be removed. |
| `@keystatic/astro` | ^5.0.6 | CMS integration | Keystatic Astro integration. Requires `output: 'hybrid'` — see limitations in Section 3. |
| `@keystatic/core` | ^0.5.50 | CMS core | Git-backed CMS schema definitions |
| `@retorquere/bibtex-parser` | ^9.0.29 | BibTeX parsing | Robust parser with LaTeX character handling. Used by Zotero. |
| `@tailwindcss/vite` | ^4.2.2 | Tailwind Vite plugin | CSS-first Tailwind 4 via Vite (replaces @astrojs/tailwind) |
| `tailwindcss` | ^4.2.2 | CSS framework | Utility-first CSS with design tokens in CSS custom properties |
| `react` | ^19.2.4 | UI library | Runtime for island components |
| `react-dom` | ^19.2.4 | React DOM | DOM rendering for React islands |
| `d3` | ^7.9.0 | Data visualization | Force-directed research graph on /graph/ page |
| `js-yaml` | ^4.1.1 | YAML parsing | Parses cv.yaml at build time |
| `reading-time` | ^1.5.0 | Reading time | Word count → estimated reading time for blog posts |
| `rehype-autolink-headings` | ^7.1.0 | Heading links | Wraps headings in anchor links for deep linking |
| `rehype-mathjax` | ^7.1.0 | Math rendering | Server-side MathJax rendering with accessibility (aria-label, speech) |
| `rehype-slug` | ^6.0.0 | Heading IDs | Adds `id` attributes to headings |
| `remark-math` | ^6.0.0 | Math parsing | Parses `$...$` and `$$...$$` into math AST nodes |
| `sharp` | ^0.34.5 | Image processing | Astro's `<Image />` component optimization pipeline |
| `slugify` | ^1.6.9 | Slug generation | URL-safe slug creation for scaffolding scripts |
| `unified` | ^11.0.5 | AST processing | Core unified pipeline for custom remark/rehype plugins |
| `unist-util-visit` | ^5.1.0 | AST traversal | Tree walker for sidenote and wikilink plugins |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@astrojs/check` | ^0.9.8 | TypeScript checking via Astro's diagnostics |
| `pagefind` | ^1.4.0 | Static search index generation (Rust/WASM) |
| `prettier` | ^3.8.1 | Code formatting |
| `prettier-plugin-astro` | ^0.14.1 | Prettier support for `.astro` files |
| `prettier-plugin-tailwindcss` | ^0.7.2 | Tailwind class sorting in Prettier |
| `tsx` | ^4.21.0 | TypeScript execution for scaffolding scripts |
| `typescript` | ^6.0.2 | TypeScript compiler (strict mode) |

### Type Definitions

| Package | Purpose |
|---------|---------|
| `@types/d3` | D3 type definitions |
| `@types/hast` | HTML AST types for rehype plugins |
| `@types/js-yaml` | js-yaml type definitions |
| `@types/react` | React type definitions |
| `@types/react-dom` | React DOM type definitions |

### Candidates for Future Removal

- **`@astrojs/cloudflare`**: Not used in static mode. Remove unless switching to SSR.
- **`@keystatic/astro` + `@keystatic/core`**: Currently limited by Astro 6 static output. Remove if not using the CMS admin UI.
- **`slugify`**: Could be replaced with a simple `toLowerCase().replace()` chain to eliminate a dependency.

---

## 3. Architectural Decisions

### 3.1 Why Astro 6 (over Eleventy, Hugo, Next.js)

Astro ships zero JavaScript by default — every page is pure HTML + CSS unless an Island explicitly opts into hydration. This is ideal for an academic site where most content is static text. Content Collections provide build-time Zod validation that catches frontmatter errors before deployment. Astro's Island architecture allows mixing React (for D3, Pagefind) without framework lock-in. Eleventy lacks built-in TypeScript and component hydration. Hugo lacks a JS ecosystem for interactive components. Next.js ships a React runtime on every page.

### 3.2 Why TypeScript Strict Mode

Strict mode (`noUncheckedIndexedAccess`, no `any`) catches null reference errors at build time. The BibTeX parser, backlink computation, and content pipeline involve complex data transformations where type safety prevents silent data corruption. Every utility function has explicit input/output types.

### 3.3 Why Tailwind CSS 4 (over CUBE CSS, vanilla CSS)

Tailwind 4 uses CSS-first configuration — design tokens are CSS custom properties in `tailwind.css`, not a JavaScript config file. This means the theme is portable and inspectable in browser DevTools. The utility-first approach eliminates class naming decisions and dead CSS. The old site used ~2,000 lines of handwritten CSS with 9 theme variants; Tailwind 4 reduces this to ~350 lines of token definitions plus utilities.

### 3.4 Why Keystatic (over Decap CMS, Tina, Sanity)

Keystatic is TypeScript-native and Git-backed with zero external service dependencies. Decap CMS required Netlify Identity (external auth service) which created a vendor lock-in. Tina requires a cloud service. Sanity is a hosted CMS with monthly costs.

**Limitation:** Keystatic's Astro integration requires `output: 'hybrid'` for its admin API routes. The site uses `output: 'static'` for maximum performance and Cloudflare Pages compatibility. The `keystatic.config.ts` is provided but not wired into `astro.config.ts`. The recommended workflow uses CLI scaffolding scripts (`npm run new:post`, etc.) and direct file editing.

### 3.5 Why Cloudflare Pages (over Netlify, Vercel, GitHub Pages)

Unlimited bandwidth on the free tier (Netlify caps at 100GB/month). Global CDN with 300+ edge locations. Native support for `_headers` file (security headers without middleware). Correct MIME types for Pagefind WASM out of the box. The site includes deployment configs for all four platforms for portability.

### 3.6 Why MathJax 4.x (over KaTeX)

KaTeX has zero accessibility support — screen readers cannot interpret its output. MathJax 4.x provides aria-label attributes on rendered math, speech generation for screen readers, keyboard navigation of sub-expressions, and Braille output. For an academic site with mathematical content, accessibility is non-negotiable. MathJax is rendered server-side at build time via `rehype-mathjax`, so there is no client-side performance penalty for pages without math.

### 3.7 Why Pagefind (over Algolia, Lunr)

Pagefind generates a static search index at build time (Rust binary) and runs entirely client-side via WASM. Zero server costs, zero API keys, zero rate limits. Algolia requires an account and has query limits on the free tier. Lunr's index size grows linearly with content and must be loaded entirely into memory. Pagefind uses chunked indexes that load only the fragments needed for each query.

### 3.8 Why React for Islands (over Svelte, vanilla JS)

React was chosen because D3 (the research graph library) integrates naturally with React's ref system, and the existing Pagefind examples use React patterns. All five island components are React functional components with hooks. Svelte would require a separate compilation pipeline. Vanilla JS would lose type safety and component composability.

### 3.9 BibTeX Parser Choice

`@retorquere/bibtex-parser` v9 — the parser used by Zotero's Better BibTeX plugin. It handles LaTeX-encoded characters (`\textmu{}`, `{OCT}`, accent commands), all BibTeX entry types, and has robust error recovery for malformed entries. `bibtex-js-parser` (the main alternative) lacks LaTeX decoding and has weaker error handling.

### 3.10 Sidenote Implementation

Custom rehype plugin (`src/utils/sidenotes.ts`) that transforms standard Markdown footnote HTML into Tufte-style margin notes at build time. On wide screens (>1200px), sidenotes appear in the right margin. On narrow screens, they use the Popover API for progressive enhancement — no JavaScript required for the basic interaction. The plugin runs after all other rehype plugins to ensure it processes the final footnote markup.

### 3.11 Backlink Computation Strategy

`src/utils/backlinks.ts` computes a global backlink graph at build time by scanning all content collections for internal links (both Markdown links and `[[wiki-links]]`). The result is a `Map<slug, BacklinkEntry[]>` that each layout queries to render "Referenced by" panels. This is a build-time-only computation — zero runtime cost.

### 3.12 Link Preview Architecture

`src/islands/LinkPreview.tsx` uses `client:idle` hydration (loads after the page is idle) to add hover/focus preview popovers on internal links. Preview data is generated at build time by `src/utils/linkPreviews.ts` and embedded as data attributes. The island reads these attributes — no runtime API calls.

### 3.13 Publications: BibTeX + getStaticPaths (not Content Layer)

Publications are parsed from `bibliography.bib` by `src/utils/bibtex.ts` at build time, not managed as a Content Collection. This preserves BibTeX as the single source of truth (Governing Principle #6) and avoids dual-maintenance of BibTeX + Markdown frontmatter. Individual publication pages are generated via `getStaticPaths()` in `src/pages/publications/[...slug].astro`.

---

## 4. Feature Flags

Features that can be toggled on or off:

| Feature | Toggle Method |
|---------|--------------|
| **MathJax** | Set `useMath: true` in post frontmatter. Remove `remark-math` + `rehype-mathjax` from `astro.config.ts` to disable globally. |
| **Sidenotes** | Remove `rehypeSidenotes` from `astro.config.ts` rehype plugins. Footnotes revert to standard bottom-of-page style. |
| **Backlinks** | Remove `<Backlinks />` component imports from layouts. The computation in `backlinks.ts` becomes a no-op. |
| **Link Previews** | Remove `<LinkPreview />` island imports. No JS is loaded. |
| **Research Graph** | Remove or unlink `/graph/` page. Remove `ResearchGraph.tsx`. D3 dependency can then be removed. |
| **Content Maturity** | Remove `<ContentMaturity />` imports from NoteLayout and NoteCard. |
| **Dark Mode** | Remove `<ThemeToggle />` island. Site defaults to system `prefers-color-scheme`. |
| **Pagefind Search** | Remove `/search/` page, `SearchWidget.tsx`, `search.css`, and the `build:search` npm script. |
| **Citation Counts** | Delete `scripts/refresh-citations.ts` and the weekly-refresh workflow. Remove `citations.json` reads from publication pages. |
| **RSS** | Remove `src/pages/rss.xml.ts`. |

---

## 5. Content Authoring Guide

### 5.1 Blog Posts

**Location:** `src/content/posts/{slug}.md`
**Create:** `npm run new:post "My Post Title"` or manually.

```yaml
---
title: "My Post Title"
date: 2026-04-05
category: technical        # technical | thesis | essay | dispatch | build-log
description: "A short SEO description under 160 characters."
tags: [optics, simulation]
published: true
featured: false
ogImage: "/images/my-post-og.png"   # optional
---

Post content in Markdown. Supports $\LaTeX$ math, `[[wiki-links]]`, and footnotes[^1].

[^1]: This becomes a sidenote on wide screens.
```

### 5.2 Projects

**Location:** `src/content/projects/{slug}.md`
**Create:** `npm run new:project "Project Title"`

```yaml
---
title: "Spectroscopic IV-OCT"
number: "01"
date: 2025-01-15
tags: [oct, spectroscopy, intravascular]
institution: "Your Institution"
contentMode: structured    # structured | freeform
techStack: [MATLAB, Python, COMSOL]
relatedPublications: [doe2026ssoct, doe2025inverse]
published: true
---

Project description in Markdown.
```

### 5.3 Teaching

**Location:** `src/content/teaching/{slug}.md`

```yaml
---
title: "Optics"
courseCode: "PHGN 320"
role: ta                   # instructor | ta | guest-lecturer
institution: "Your University"
semester: "Fall 2025"
year: 2023
description: "Undergraduate optics covering wave theory, interference, and diffraction."
tags: [optics, physics]
published: true
---

Additional course details in Markdown.
```

### 5.4 Notes (Digital Garden)

**Location:** `src/content/notes/{slug}.md`
**Create:** `npm run new:note "Note Title"`

```yaml
---
title: "OCT Fundamentals"
date: 2025-06-15
maturity: seedling          # seedling | budding | evergreen
description: "Core principles of optical coherence tomography."
tags: [oct, interferometry]
published: true
---

Note content. Use [[wiki-links]] to cross-reference other notes.
```

### 5.5 Publications

**Location:** `src/data/bibliography.bib`
**Edit with:** JabRef, Zotero export, or any text editor.

Publications are NOT managed through the CMS or as Content Collections. The `.bib` file is the single source of truth. Each BibTeX entry generates a publication page, Highwire Press meta tags, and JSON-LD structured data automatically.

Custom fields beyond standard BibTeX: `status` (published/under-review/preprint/accepted), `code` (GitHub URL), `slides` (path), `poster` (path), `pdf` (path).

### 5.6 CV

**Location:** `src/data/cv.yaml`
**Edit:** Directly in a text editor.

The YAML structure includes: name, title, affiliation, research interests, education, experience, research experience, publications (count auto-generated from .bib), teaching, technical skills, awards/honors, service, and talks.

---

## 6. Deployment Guide

### 6.1 Cloudflare Pages (Primary)

1. Create a Cloudflare Pages project in the dashboard.
2. Connect your GitHub repository.
3. Set build configuration:
   - Build command: `npm run build && npx pagefind --site dist`
   - Output directory: `dist`
   - Node.js version: `20`
   - Environment variable: `NODE_ENV=production`
4. Add secrets in GitHub: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
5. Push to `main` — the `build-deploy.yml` workflow deploys automatically.
6. Custom domain: Add in Cloudflare Pages dashboard → Custom Domains.

Security headers are served via `public/_headers` (copied to `dist/_headers` at build time).

### 6.2 GitHub Pages

1. Enable GitHub Pages in repo Settings → Pages → Source: GitHub Actions.
2. Rename or enable `.github/workflows/gh-pages.yml`.
3. Disable `build-deploy.yml` (or set it to a different branch trigger).
4. Update `astro.config.ts` → `site` to `https://{username}.github.io/{repo}`.
5. Push to `main`.

### 6.3 Netlify

1. Connect repo in Netlify dashboard.
2. `netlify.toml` is auto-detected — no manual build config needed.
3. Install command uses `--legacy-peer-deps` via `NPM_FLAGS` env var.
4. Custom domain: Add in Netlify dashboard → Domain Management.

### 6.4 Vercel

1. Import repo in Vercel dashboard.
2. `vercel.json` is auto-detected.
3. Override install command to `npm ci --legacy-peer-deps` if not auto-detected.
4. Custom domain: Add in Vercel dashboard → Domains.

### Environment Variables (All Platforms)

| Variable | Required | Purpose |
|----------|----------|---------|
| `NODE_ENV` | Yes | Set to `production` for optimized builds |
| `CLOUDFLARE_API_TOKEN` | Cloudflare only | Pages deploy authentication |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare only | Cloudflare account identifier |

---

## 7. Performance Budget

### Current Measurements (Session 6–7)

| Metric | Value | Budget | Status |
|--------|-------|--------|--------|
| Total CSS | 45.2 KB | < 50 KB | ✅ Pass |
| Total JS (non-page islands) | 6.6 KB | < 10 KB | ✅ Pass |
| Theme toggle inline script | 180 bytes | < 500 bytes | ✅ Pass |
| Build time | ~24 seconds | < 30 seconds | ✅ Pass |
| Pages built | 45 | — | — |
| Pagefind index | 38 pages, 1339 words, 5 filters | — | — |

### Lighthouse Score Targets

| Category | Target | Notes |
|----------|--------|-------|
| Performance | ≥ 90 | Static HTML + minimal JS should achieve 95+ |
| Accessibility | ≥ 95 | MathJax a11y, ARIA, focus indicators, color independence |
| Best Practices | ≥ 95 | Security headers, HTTPS, no deprecated APIs |
| SEO | ≥ 95 | Structured data, meta tags, sitemap, robots.txt |

### Thresholds to Maintain

- **Zero JS on non-interactive pages.** Pages without islands should ship exactly 0 bytes of JavaScript.
- **No layout shift.** `font-display: optional` prevents FOUT. All images must have `width` and `height`.
- **Build under 30 seconds.** If build time increases, audit for unnecessary re-rendering or large asset processing.

---

## 8. Design Rationale and Comparisons

### Why This Architecture Over Common Alternatives

| Aspect | Common Alternative | This Template | Rationale |
|--------|-------------------|---------------|-----------|
| Framework | Eleventy v3 + Nunjucks | Astro 6 + TypeScript | Type safety, Content Collections, Island architecture |
| Styling | ~2,000 lines handwritten CSS, 9 theme variants | Tailwind CSS 4, 2 themes (light/dark) | Maintainability, design token portability |
| CMS | Decap CMS (Netlify Identity) | Keystatic + CLI scripts | Zero external auth dependency |
| Math | KaTeX | MathJax 4.x | Accessibility (screen reader, speech, Braille) |
| JS loading | 16+ global scripts (Swup, analytics, etc.) | 5 Islands with explicit hydration | Zero JS by default |
| Publication data | Markdown frontmatter + manual BibTeX | Single `.bib` file parsed at build | Eliminated dual maintenance |
| Search | None | Pagefind (Rust/WASM) | Client-side, zero server cost |
| Hosting | Netlify | Cloudflare Pages (+ 3 alternatives) | Unlimited bandwidth, better CDN |
| Content validation | None | Zod schemas at build time | Catches errors before deployment |

### Content Included as Examples

The template ships with realistic example content to demonstrate all features:

- 3 blog posts (technical, build-log, essay categories)
- 2 research projects (example structured and freeform modes)
- 2 teaching entries (example TA roles)
- 4 digital garden notes (example maturity levels and wiki-links)
- 11 BibTeX publications spanning articles, conference papers, theses, book chapters
- CV data: education, experience, research, teaching, skills, awards
- Site metadata: placeholder values for name, role, affiliations, contact, social links

Replace all example content with your own before deploying.

### Core Design Features

- Frosted-glass navigation with backdrop-filter blur
- Mint green accent (#AFFFAB) in the Tailwind theme (easily customizable)
- Publication listing with inline abstract toggle
- Highwire Press meta tags for Google Scholar indexing
- JSON-LD structured data (Person, ScholarlyArticle, BlogPosting, etc.)
- Dark/light theme with system preference detection
- Responsive design with mobile hamburger nav
- Print-optimized CV page

### Advanced Features

- Tufte-style sidenotes (replaces standard footnotes)
- Bidirectional backlinks across all content types
- Research knowledge graph (D3 force-directed visualization)
- Digital garden with maturity indicators
- Pagefind search with type/year/tag filters
- Link preview popovers
- Table of contents on blog posts
- Content scaffolding CLI scripts
- Automated citation count refresh (Semantic Scholar API)

### Deliberate Omissions

The template deliberately excludes these patterns in favor of simplicity:

- Multi-theme color system → simplified to light/dark with one accent color
- CMS-driven appearance configuration (font choice, photo style, layout variants)
- Client-side page transitions → Astro View Transitions (native, zero-dependency)
- Client-side font loading → self-hosted WOFF2 with `font-display: optional`
- Excessive CMS configurability → opinionated defaults with code-level customization

---

## 9. Known Limitations and Future Enhancements

### Current Limitations

1. **Font files not present.** `@font-face` declarations reference IBM Plex WOFF2 files in `public/fonts/` that are not included. The site degrades gracefully via `font-display: optional` to system fonts. Add the font files to restore custom typography.

2. **Profile photo placeholder.** Homepage and about page have a placeholder div. Replace with `public/images/profile.jpg`.

3. **Keystatic requires hybrid mode.** The CMS admin UI cannot run with `output: 'static'`. Use CLI scaffolding scripts or direct file editing for content management.

4. **Google Scholar URL is placeholder.** Update `contact.googleScholar` in `src/data/meta.ts` with the real Google Scholar profile URL.

5. **ORCID data not wired into pages.** `src/data/orcid.ts` exports `fetchOrcidData()` but no page imports it. Can be wired into the publications or about page.

6. **PDF files not present.** `bibliography.bib` references PDF files in `public/files/` that don't exist. Add PDFs for publications that have them.

7. **`--legacy-peer-deps` required.** Keystatic has a peer dependency conflict with Astro 6. This flag is needed for `npm install`.

8. **Homepage heading skip.** Homepage jumps h1 → h3 because publication cards use `<h3>` directly. Fix by wrapping in a section with an `<h2>`.

9. **Wiki-links only resolve to notes.** The `[[wiki-link]]` syntax only links to the notes collection. Cross-collection wiki-links would require extending the remark plugin.

10. **No author-year citation syntax.** Pandoc-style `[@key]` inline citations are not supported. References must link manually.

### Future Enhancements

- **ORCID auto-sync.** Wire `fetchOrcidData()` into publication and about pages to display live ORCID profile data.
- **Citation count display.** Show Semantic Scholar citation counts on publication cards (data already collected by weekly refresh).
- **Semantic Scholar integration.** Fetch paper abstracts, related papers, and citation graphs from the S2 API.
- **Quarto integration.** Support `.qmd` computational notebooks as blog posts with live code execution results.
- **Interactive domain-specific visualizations.** Build custom Astro Islands for interactive demos relevant to your research.
- **i18n support.** Astro 6 has built-in i18n routing for multi-language academic content.
- **Webmentions.** Receive and display webmentions on blog posts for IndieWeb integration.
- **Cross-collection wiki-links.** Extend the remark plugin to resolve `[[links]]` across posts, projects, and publications.
- **OpenGraph image generation.** Auto-generate OG images from post titles using `@vercel/og` or `satori`.
- **Playwright visual regression tests.** Screenshot comparison tests for layout changes across themes.
