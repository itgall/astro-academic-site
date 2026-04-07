/**
 * orcid.ts — Build-time ORCID public profile fetch.
 *
 * If an ORCID ID is configured in data/meta.ts, fetches the public profile
 * from the ORCID API v3.0 at build time. Results are cached to a local file
 * with a 1-day TTL to avoid hammering the API on repeated builds.
 *
 * Fails gracefully: if the API is unavailable, returns 4xx/5xx, or ORCID
 * is not configured, returns empty data without failing the build.
 */

import { siteMetadata } from "@data/meta";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface OrcidWork {
  title: string;
  type: string;
  year: string;
  doi?: string;
  url?: string;
}

export interface OrcidEducation {
  institution: string;
  degree?: string;
  department?: string;
  startYear?: string;
  endYear?: string;
}

export interface OrcidEmployment {
  organization: string;
  role?: string;
  department?: string;
  startYear?: string;
  endYear?: string;
}

export interface OrcidData {
  /** Whether data was successfully fetched */
  available: boolean;
  name?: string;
  works: OrcidWork[];
  education: OrcidEducation[];
  employment: OrcidEmployment[];
}

const EMPTY_DATA: OrcidData = {
  available: false,
  works: [],
  education: [],
  employment: [],
};

/* ── Cache management ─────────────────────────────────────────────────────── */

const CACHE_DIR = resolve(".cache");
const CACHE_FILE = resolve(CACHE_DIR, "orcid.json");
/** Cache TTL: 24 hours in milliseconds */
const CACHE_TTL = 24 * 60 * 60 * 1000;

interface CacheEntry {
  timestamp: number;
  data: OrcidData;
}

function readCache(): OrcidData | null {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    const raw = readFileSync(CACHE_FILE, "utf-8");
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL) return null;
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache(data: OrcidData): void {
  try {
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
    }
    const entry: CacheEntry = { timestamp: Date.now(), data };
    writeFileSync(CACHE_FILE, JSON.stringify(entry, null, 2));
  } catch {
    /* Cache write failure is non-fatal */
  }
}

/* ── API fetch ────────────────────────────────────────────────────────────── */

/**
 * Extract a simple string from ORCID's deeply nested response structures.
 */
function extractString(obj: unknown, ...keys: string[]): string | undefined {
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

/**
 * Fetch ORCID public profile data.
 *
 * Uses the ORCID public API v3.0 with JSON accept header.
 * Extracts works, education, and employment summaries.
 */
export async function fetchOrcidData(): Promise<OrcidData> {
  const orcidId = siteMetadata.contact.orcid;

  /* No ORCID configured — return empty data */
  if (!orcidId) {
    return EMPTY_DATA;
  }

  /* Check cache first */
  const cached = readCache();
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(
      `https://pub.orcid.org/v3.0/${orcidId}`,
      {
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      console.warn(
        `[orcid] ORCID API returned ${response.status} for ${orcidId}. Using empty data.`,
      );
      return EMPTY_DATA;
    }

    const profile = await response.json();

    /* ── Extract name ─────────────────────────────────────────────── */
    const creditName = extractString(profile, "person", "name", "credit-name", "value");
    const givenName = extractString(profile, "person", "name", "given-names", "value");
    const familyName = extractString(profile, "person", "name", "family-name", "value");
    const name = creditName ?? (givenName && familyName ? `${givenName} ${familyName}` : undefined);

    /* ── Extract works ────────────────────────────────────────────── */
    const worksGroups =
      (profile?.["activities-summary"]?.works?.group as unknown[]) ?? [];
    const works: OrcidWork[] = [];

    for (const group of worksGroups) {
      const summaries =
        (group as Record<string, unknown>)?.["work-summary"] as unknown[];
      if (!summaries || summaries.length === 0) continue;
      const summary = summaries[0] as Record<string, unknown>;

      const title = extractString(summary, "title", "title", "value") ?? "Untitled";
      const type = (summary?.type as string) ?? "other";
      const year =
        extractString(summary, "publication-date", "year", "value") ?? "";

      /* Extract DOI from external IDs */
      const externalIdContainer = summary?.["external-ids"] as Record<string, unknown> | undefined;
      const externalIds =
        (externalIdContainer?.["external-id"] as unknown[]) ?? [];
      let doi: string | undefined;
      for (const eid of externalIds) {
        const idType = (eid as Record<string, unknown>)?.["external-id-type"];
        if (idType === "doi") {
          doi = (eid as Record<string, unknown>)?.[
            "external-id-value"
          ] as string;
          break;
        }
      }

      works.push({ title, type, year, doi });
    }

    /* ── Extract education ────────────────────────────────────────── */
    const eduGroups =
      (profile?.["activities-summary"]?.educations?.[
        "affiliation-group"
      ] as unknown[]) ?? [];
    const education: OrcidEducation[] = [];

    for (const group of eduGroups) {
      const summaries =
        (group as Record<string, unknown>)?.summaries as unknown[];
      if (!summaries || summaries.length === 0) continue;
      const summary = (summaries[0] as Record<string, unknown>)?.[
        "education-summary"
      ] as Record<string, unknown>;
      if (!summary) continue;

      education.push({
        institution:
          extractString(summary, "organization", "name") ?? "Unknown",
        degree: extractString(summary, "role-title") ?? undefined,
        department:
          extractString(summary, "department-name") ?? undefined,
        startYear:
          extractString(summary, "start-date", "year", "value") ?? undefined,
        endYear:
          extractString(summary, "end-date", "year", "value") ?? undefined,
      });
    }

    /* ── Extract employment ───────────────────────────────────────── */
    const empGroups =
      (profile?.["activities-summary"]?.employments?.[
        "affiliation-group"
      ] as unknown[]) ?? [];
    const employment: OrcidEmployment[] = [];

    for (const group of empGroups) {
      const summaries =
        (group as Record<string, unknown>)?.summaries as unknown[];
      if (!summaries || summaries.length === 0) continue;
      const summary = (summaries[0] as Record<string, unknown>)?.[
        "employment-summary"
      ] as Record<string, unknown>;
      if (!summary) continue;

      employment.push({
        organization:
          extractString(summary, "organization", "name") ?? "Unknown",
        role: extractString(summary, "role-title") ?? undefined,
        department:
          extractString(summary, "department-name") ?? undefined,
        startYear:
          extractString(summary, "start-date", "year", "value") ?? undefined,
        endYear:
          extractString(summary, "end-date", "year", "value") ?? undefined,
      });
    }

    const data: OrcidData = {
      available: true,
      name,
      works,
      education,
      employment,
    };

    writeCache(data);
    return data;
  } catch (err) {
    console.warn(
      `[orcid] Failed to fetch ORCID profile for ${orcidId}:`,
      err instanceof Error ? err.message : String(err),
    );
    return EMPTY_DATA;
  }
}
