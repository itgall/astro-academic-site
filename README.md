# Astro Academic Site

Production-grade academic website template built on Astro 6 — zero JavaScript by default.

## Features

- **BibTeX-driven publications engine** — single `.bib` file generates individual pages with Highwire Press meta tags + JSON-LD `ScholarlyArticle` structured data for Google Scholar indexing
- **Zero JS by default** — every page renders and functions without client-side JavaScript; interactive components use Astro Islands with explicit hydration directives
- **Tufte-style sidenotes** — margin notes that collapse responsively on mobile
- **Bidirectional backlinks** — wiki-style `[[links]]` with automatic backlink panels
- **Research knowledge graph** — interactive force-directed visualization of publication/note connections
- **Digital garden** — notes with maturity indicators (🌱 seedling → 🌿 budding → 🌲 evergreen)
- **Pagefind search** — Rust/WASM client-side search with filters by year, type, and topic
- **Content Collections** — Zod-validated schemas for posts, projects, teaching, and notes
- **Dark/light theme** — system preference detection with manual toggle and zero FOUC
- **WCAG 2.2 AA accessible** — MathJax 4.x, proper ARIA roles, 4.5:1 contrast, 24×24px targets

## One-Click Deploy

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://dash.cloudflare.com/?to=/:account/pages/new/provider/github)
[![Deploy to Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://app.netlify.com/start)
[![Deploy to Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/new)

## Prerequisites

- **Node.js ≥ 20** (LTS recommended)
- **npm** (included with Node.js)

## Quickstart

```bash
# Clone the repository
git clone https://github.com/your-username/astro-academic-site.git
cd astro-academic-site

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Astro dev server with HMR |
| `npm run build` | Build static site to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run build:search` | Generate Pagefind search index |
| `npm run check` | TypeScript type checking via Astro |
| `npm run format` | Format code with Prettier |
| `npm run new:post` | Scaffold a new blog post |
| `npm run new:project` | Scaffold a new project entry |
| `npm run new:note` | Scaffold a new digital garden note |
| `npm run refresh:citations` | Fetch citation counts from Semantic Scholar |

## Architecture

```
src/
├── content/          # Content Collections (Markdown/MDX)
│   ├── posts/        # Blog articles
│   ├── projects/     # Research projects
│   ├── teaching/     # Courses
│   └── notes/        # Digital garden
├── data/             # Structured data (BibTeX, YAML, TypeScript)
├── layouts/          # Page layout templates
├── components/       # Astro components (zero JS)
├── islands/          # React components (hydrated on demand)
├── pages/            # File-based routing
├── utils/            # TypeScript utilities
└── styles/           # Global + component CSS
```

## Technology Stack

- **Framework:** Astro 6 (static site generation)
- **Styling:** Tailwind CSS 4 (CSS-first config)
- **Content:** Markdown + MDX with Content Collections
- **Interactivity:** React Islands (hydrated on demand)
- **Search:** Pagefind (Rust/WASM, post-build)
- **Math:** MathJax 4.x (accessible, server-rendered)
- **Hosting:** Cloudflare Pages (unlimited bandwidth)
- **CMS:** Sveltia CMS (Git-backed, zero infrastructure)

## Content Management

### Admin Page (Sveltia CMS)

The site includes a browser-based admin dashboard at `/admin/` powered by Sveltia CMS. From the admin page, you can create, edit, and delete blog posts, projects, notes, teaching entries, CV data, and BibTeX publications — all without touching code. Changes are committed directly to your GitHub repository via the GitHub API, which triggers an automatic rebuild and deploy.

**Setup (one-time):**

1. Open `public/admin/config.yml` and replace `your-username/astro-academic-site` with your actual GitHub repo (e.g., `itgall/astro-academic-site`).
2. Navigate to `https://your-site.com/admin/` in your browser.
3. Authenticate using one of two methods:

**Option A — Personal Access Token (simplest, no backend):**
Create a fine-grained Personal Access Token at [github.com/settings/tokens](https://github.com/settings/tokens) with **Contents** read/write permission on your repository. Enter the token in the Sveltia CMS login screen. Done.

**Option B — GitHub OAuth (polished login experience):**
Deploy the [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth) to Cloudflare Workers (free tier, one-click deploy). Create a GitHub OAuth App at [github.com/settings/developers](https://github.com/settings/developers). Add `base_url: https://your-auth-worker.workers.dev` to the backend section in `config.yml`. Users see a "Login with GitHub" button.

### CLI Scaffolding

For terminal-first workflows, scaffolding scripts create new content files with valid frontmatter: `npm run new:post "Title"`, `npm run new:project "Title"`, `npm run new:note "Title"`.

### Direct File Editing

All content is plain Markdown with YAML frontmatter in `src/content/`. Publications live in `src/data/bibliography.bib` (edit with JabRef, Zotero, or any text editor). CV data is in `src/data/cv.yaml`. Each content type has a Zod schema in `src/content.config.ts` that validates frontmatter at build time.

## License

MIT — see [LICENSE](./LICENSE) for details.
