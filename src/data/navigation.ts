/**
 * Navigation Configuration — typed, centralized.
 *
 * Defines the primary and footer navigation structures.
 * Extracted from the old site's per-profile nav_links arrays.
 */

export interface NavItem {
  /** Display label */
  label: string;
  /** URL path (internal) or full URL (external) */
  href: string;
  /** Optional: highlight as current page when URL starts with this path */
  activeMatch?: string;
  /** Optional: open in new tab */
  external?: boolean;
}

export interface SocialLink {
  label: string;
  href: string;
  /** Icon identifier for the social link (rendered by Footer component) */
  icon: "github" | "linkedin" | "orcid" | "scholar" | "email" | "rss";
}

/** Primary navigation — displayed in the top nav bar. */
export const primaryNav: NavItem[] = [
  { label: "Home", href: "/", activeMatch: "^/$" },
  { label: "Publications", href: "/publications/", activeMatch: "/publications" },
  { label: "Projects", href: "/projects/", activeMatch: "/projects" },
  { label: "Blog", href: "/blog/", activeMatch: "/blog" },
  { label: "Notes", href: "/notes/", activeMatch: "/notes" },
  { label: "Graph", href: "/graph/", activeMatch: "/graph" },
  { label: "CV", href: "/cv/", activeMatch: "/cv" },
  { label: "About", href: "/about/", activeMatch: "/about" },
];

/** Footer navigation — subset of primary nav plus extras. */
export const footerNav: NavItem[] = [
  { label: "Publications", href: "/publications/" },
  { label: "Projects", href: "/projects/" },
  { label: "Blog", href: "/blog/" },
  { label: "CV", href: "/cv/" },
  { label: "About", href: "/about/" },
  { label: "Contact", href: "/contact/" },
  { label: "RSS", href: "/rss.xml", external: true },
];

/** Social links — displayed in footer and contact page. Replace with your own. */
export const socialLinks: SocialLink[] = [
  { label: "GitHub", href: "https://github.com/your-handle", icon: "github" },
  { label: "LinkedIn", href: "https://linkedin.com/in/your-handle", icon: "linkedin" },
  { label: "Google Scholar", href: "https://scholar.google.com/citations?user=YOUR_ID", icon: "scholar" },
  { label: "ORCID", href: "https://orcid.org/0000-0000-0000-0000", icon: "orcid" },
  { label: "Email", href: "mailto:you@university.edu", icon: "email" },
  { label: "RSS Feed", href: "/rss.xml", icon: "rss" },
];
