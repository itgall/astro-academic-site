/**
 * refresh-citations.ts — Fetch citation counts from Semantic Scholar API.
 *
 * Reads DOIs from src/data/bibliography.bib, queries the Semantic Scholar
 * Graph API for each, and writes citation counts to src/data/citations.json.
 *
 * Rate limiting: Semantic Scholar allows 100 requests per 5 minutes without
 * an API key. We add a 3.5-second delay between requests to stay well within
 * limits. For 11 publications this takes ~40 seconds — acceptable for a
 * weekly cron job.
 *
 * Usage:
 *   npx tsx scripts/refresh-citations.ts
 *   npm run refresh:citations
 *
 * Exit codes:
 *   0 — Success (even if some DOIs failed; partial results are written)
 *   1 — Fatal error (cannot read .bib file or write output)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/** Semantic Scholar paper endpoint with citation count field */
const S2_API_BASE = "https://api.semanticscholar.org/graph/v1/paper/DOI:";
const S2_FIELDS = "?fields=citationCount";

/** Delay between API requests in milliseconds (3.5s → ~17 req/min, well under 100/5min) */
const REQUEST_DELAY_MS = 3500;

/** Path constants relative to project root */
const BIB_PATH = join(process.cwd(), "src", "data", "bibliography.bib");
const OUTPUT_PATH = join(process.cwd(), "src", "data", "citations.json");

/**
 * Extract all DOI values from a BibTeX file using regex.
 * Matches lines like: doi = {10.1364/BOE.512345},
 * Returns an array of unique DOI strings.
 */
function extractDois(bibContent: string): string[] {
  const doiRegex = /doi\s*=\s*\{([^}]+)\}/gi;
  const dois: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = doiRegex.exec(bibContent)) !== null) {
    const doi = match[1].trim();
    if (doi.length > 0) {
      dois.push(doi);
    }
  }

  return [...new Set(dois)];
}

/** Sleep for a given number of milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch citation count for a single DOI from Semantic Scholar.
 * Returns the count on success, null on failure.
 */
async function fetchCitationCount(doi: string): Promise<number | null> {
  const url = `${S2_API_BASE}${encodeURIComponent(doi)}${S2_FIELDS}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "astro-academic-site/1.0 (citation-refresh)",
      },
    });

    if (response.status === 404) {
      console.warn(`  ⚠ DOI not found in Semantic Scholar: ${doi}`);
      return null;
    }

    if (response.status === 429) {
      console.warn(`  ⚠ Rate limited by Semantic Scholar. Waiting 60s...`);
      await sleep(60_000);
      return fetchCitationCount(doi);
    }

    if (!response.ok) {
      console.warn(`  ⚠ HTTP ${response.status} for DOI: ${doi}`);
      return null;
    }

    const data = (await response.json()) as { citationCount?: number };
    return typeof data.citationCount === "number" ? data.citationCount : null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`  ⚠ Network error for DOI ${doi}: ${message}`);
    return null;
  }
}

/** Main execution: read DOIs, fetch counts, write results. */
async function main(): Promise<void> {
  console.log("[citations] Starting citation refresh...");

  if (!existsSync(BIB_PATH)) {
    console.error(`[citations] ERROR: bibliography.bib not found at ${BIB_PATH}`);
    process.exit(1);
  }

  const bibContent = readFileSync(BIB_PATH, "utf-8");
  const dois = extractDois(bibContent);
  console.log(`[citations] Found ${dois.length} unique DOIs in bibliography.bib`);

  if (dois.length === 0) {
    console.log("[citations] No DOIs to process. Writing empty citations file.");
    writeFileSync(OUTPUT_PATH, JSON.stringify({}, null, 2) + "\n", "utf-8");
    return;
  }

  /** Load existing citations to preserve counts on transient failures */
  let existing: Record<string, number> = {};
  if (existsSync(OUTPUT_PATH)) {
    try {
      existing = JSON.parse(readFileSync(OUTPUT_PATH, "utf-8")) as Record<string, number>;
    } catch {
      console.warn("[citations] Could not parse existing citations.json, starting fresh.");
    }
  }

  const results: Record<string, number> = {};
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < dois.length; i++) {
    const doi = dois[i];
    console.log(`[citations] (${i + 1}/${dois.length}) Fetching: ${doi}`);

    const count = await fetchCitationCount(doi);

    if (count !== null) {
      results[doi] = count;
      successCount++;
      console.log(`  ✓ ${count} citation${count === 1 ? "" : "s"}`);
    } else {
      failCount++;
      if (doi in existing) {
        results[doi] = existing[doi];
        console.log(`  ↩ Kept previous count: ${existing[doi]}`);
      }
    }

    if (i < dois.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  /** Sort keys for deterministic output (cleaner git diffs) */
  const sortedResults: Record<string, number> = {};
  for (const key of Object.keys(results).sort()) {
    sortedResults[key] = results[key];
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(sortedResults, null, 2) + "\n", "utf-8");

  console.log(
    `\n[citations] Done. ${successCount} succeeded, ${failCount} failed. ` +
      `Results written to src/data/citations.json`,
  );
}

main().catch((error) => {
  console.error("[citations] Fatal error:", error);
  process.exit(1);
});
