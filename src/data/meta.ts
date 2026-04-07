/**
 * Site Metadata — typed, centralized configuration.
 *
 * All personal information is in one place for easy updates. Used by
 * Head.astro, SEO.astro, and JSON-LD structured data generation.
 *
 * ⚠️  Replace every placeholder value below before deploying.
 */

export interface SiteMetadata {
  /** Site title — used in <title> and Open Graph */
  title: string;
  /** Full name of the site owner */
  name: string;
  /** Primary professional role */
  role: string;
  /** Secondary role/affiliation line */
  subtitle: string;
  /** Short bio for meta descriptions (≤160 chars) */
  description: string;
  /** Production URL — no trailing slash */
  siteUrl: string;
  /** Path to profile image relative to public/ */
  image: string;
  /** ISO language code */
  language: string;
  /** Contact information */
  contact: {
    professionalEmail: string;
    personalEmail: string;
    linkedin: string;
    linkedinHandle: string;
    github: string;
    googleScholar: string;
    orcid: string;
  };
  /** Institutional affiliations */
  affiliations: Array<{
    name: string;
    parent?: string;
    url?: string;
  }>;
  /** Education */
  education: Array<{
    degree: string;
    school: string;
    dates: string;
  }>;
  /** Professional experience */
  experience: Array<{
    title: string;
    org: string;
    dates: string;
    current: boolean;
  }>;
  /** Research interests for JSON-LD knowsAbout */
  knowsAbout: string[];
  /** Footer text */
  footer: {
    copyright: string;
    disclaimer: string;
  };
}

/**
 * Default site metadata — replace ALL placeholder values with your own.
 *
 * This file is the single source of personal information for the entire site.
 * Update every field below before deploying.
 */
export const siteMetadata: SiteMetadata = {
  title: "Your Name",
  name: "Your Name",
  role: "Your Role",
  subtitle: "Your Lab · Your University",
  description:
    "Your Name — Your Role at Your Institution. One-line research summary for SEO (≤160 chars).",
  siteUrl: "https://your-domain.com",
  image: "/images/profile.jpg",
  language: "en",

  contact: {
    professionalEmail: "you@university.edu",
    personalEmail: "",
    linkedin: "https://linkedin.com/in/your-handle",
    linkedinHandle: "your-handle",
    github: "https://github.com/your-handle",
    googleScholar: "https://scholar.google.com/citations?user=YOUR_ID",
    orcid: "0000-0000-0000-0000",
  },

  affiliations: [
    {
      name: "Your Lab or Center",
      parent: "Your Department / Your University",
      url: "https://your-lab.university.edu",
    },
  ],

  education: [
    {
      degree: "Ph.D. Your Field",
      school: "Your University",
      dates: "20XX–20XX",
    },
  ],

  experience: [
    {
      title: "Your Current Title",
      org: "Your Institution",
      dates: "20XX–Present",
      current: true,
    },
  ],

  knowsAbout: [
    "Your Research Area 1",
    "Your Research Area 2",
    "Your Research Area 3",
  ],

  footer: {
    copyright: `© ${new Date().getFullYear()} Your Name. All rights reserved.`,
    disclaimer:
      "The views expressed on this site are my own and do not represent those of any affiliated institution.",
  },
} as const;
