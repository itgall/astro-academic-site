/**
 * SearchWidget.tsx — Pagefind search island.
 *
 * Hydration: client:load — search IS the page's purpose; must be immediately
 * interactive. Pagefind's WASM index is loaded on mount.
 *
 * Features:
 *   - Full-text search across all indexed content
 *   - Filter chips for: content type, year, maturity, keywords
 *   - Highlighted result excerpts
 *   - Loading state while WASM initializes
 *   - Keyboard accessible (Escape clears)
 *   - Matches site's Tailwind design tokens via CSS custom properties
 *
 * Pagefind generates a WASM index at build time in dist/_pagefind/.
 */
import { useState, useEffect, useRef, useCallback } from "react";

/* ── Pagefind type declarations ─────────────────────────────────────────── */

interface PagefindResult {
  id: string;
  url: string;
  excerpt: string;
  meta: Record<string, string>;
  filters: Record<string, string[]>;
  sub_results?: Array<{
    title: string;
    url: string;
    excerpt: string;
  }>;
}

interface PagefindResponse {
  results: Array<{ id: string; data: () => Promise<PagefindResult> }>;
  unfilteredResultCount: number;
  filters: Record<string, Record<string, number>>;
  totalFilters: Record<string, Record<string, number>>;
}

interface PagefindInstance {
  init: () => Promise<void>;
  search: (
    query: string,
    options?: { filters?: Record<string, string[]> },
  ) => Promise<PagefindResponse>;
  filters: () => Promise<Record<string, Record<string, number>>>;
  destroy: () => void;
}

/* ── Component ──────────────────────────────────────────────────────────── */

export default function SearchWidget() {
  const [pagefind, setPagefind] = useState<PagefindInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PagefindResult[]>([]);
  const [resultCount, setResultCount] = useState(0);
  const [searched, setSearched] = useState(false);
  const [availableFilters, setAvailableFilters] = useState<
    Record<string, Record<string, number>>
  >({});
  const [activeFilters, setActiveFilters] = useState<
    Record<string, string[]>
  >({});

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Initialize Pagefind ────────────────────────────────────────────── */

  useEffect(() => {
    async function initPagefind() {
      try {
        /**
         * Pagefind's JS is generated at build time in dist/_pagefind/.
         * The dynamic import path is resolved at runtime by the browser.
         */
        const pagefindPath = "/pagefind/pagefind.js";
        const pf = await import(/* @vite-ignore */ pagefindPath);
        await pf.init();
        setPagefind(pf as unknown as PagefindInstance);
        const filters = await pf.filters();
        setAvailableFilters(filters);
        setLoading(false);
      } catch {
        setError(
          "Search index not found. Run the production build to generate it.",
        );
        setLoading(false);
      }
    }
    initPagefind();
  }, []);

  /* ── Read initial query from URL (?q=...) ───────────────────────────── */

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setQuery(q);
  }, []);

  /* ── Search execution ───────────────────────────────────────────────── */

  const executeSearch = useCallback(
    async (searchQuery: string, filters: Record<string, string[]>) => {
      if (!pagefind) return;
      if (!searchQuery.trim()) {
        setResults([]);
        setResultCount(0);
        setSearched(false);
        return;
      }

      setSearched(true);
      const filtersToApply: Record<string, string[]> = {};
      for (const [key, values] of Object.entries(filters)) {
        if (values.length > 0) filtersToApply[key] = values;
      }

      const response = await pagefind.search(searchQuery, {
        filters:
          Object.keys(filtersToApply).length > 0
            ? filtersToApply
            : undefined,
      });

      setResultCount(response.unfilteredResultCount);
      const loaded = await Promise.all(
        response.results.slice(0, 12).map((r) => r.data()),
      );
      setResults(loaded);
      setAvailableFilters(response.totalFilters);
    },
    [pagefind],
  );

  /* ── Debounced search on query or filter change ─────────────────────── */

  useEffect(() => {
    if (!pagefind) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      executeSearch(query, activeFilters);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, activeFilters, pagefind, executeSearch]);

  /* ── Filter toggle ──────────────────────────────────────────────────── */

  function toggleFilter(filterKey: string, value: string) {
    setActiveFilters((prev) => {
      const current = prev[filterKey] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [filterKey]: next };
    });
  }

  /* ── Keyboard handler ───────────────────────────────────────────────── */

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setQuery("");
      setResults([]);
      setSearched(false);
      setActiveFilters({});
      inputRef.current?.focus();
    }
  }

  /* ── Render filter chips ────────────────────────────────────────────── */

  function renderFilterChips(filterKey: string, label: string) {
    const filterValues = availableFilters[filterKey];
    if (!filterValues || Object.keys(filterValues).length === 0) return null;

    const sortedValues = Object.entries(filterValues).sort(([a], [b]) => {
      if (filterKey === "year") return Number(b) - Number(a);
      return a.localeCompare(b);
    });

    const activeSet = new Set(activeFilters[filterKey] ?? []);

    return (
      <fieldset key={filterKey} className="search-filter-group">
        <legend className="search-filter-legend">{label}</legend>
        <div className="search-filter-chips">
          {sortedValues.map(([value, count]) => {
            const isActive = activeSet.has(value);
            return (
              <button
                key={value}
                type="button"
                role="checkbox"
                aria-checked={isActive}
                onClick={() => toggleFilter(filterKey, value)}
                className={`search-chip ${isActive ? "search-chip--active" : ""}`}
              >
                {value}
                <span className="search-chip-count">{count}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  /* ── Loading state ──────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div
        data-island="search-widget"
        role="status"
        aria-live="polite"
        className="search-loading"
      >
        <div className="search-spinner" />
        <span>Loading search index…</span>
      </div>
    );
  }

  /* ── Error state ────────────────────────────────────────────────────── */

  if (error) {
    return (
      <div data-island="search-widget" role="alert" className="search-error">
        <p>{error}</p>
        <p className="search-error-hint">
          To use search locally, run:{" "}
          <code>npm run build:search &amp;&amp; npx astro preview</code>
        </p>
      </div>
    );
  }

  /* ── Main search UI ─────────────────────────────────────────────────── */

  return (
    <div data-island="search-widget" onKeyDown={handleKeyDown}>
      {/* Search input */}
      <div className="search-input-wrap">
        <label htmlFor="search-input" className="sr-only">
          Search this site
        </label>
        <input
          ref={inputRef}
          id="search-input"
          type="search"
          aria-label="Search this site"
          placeholder="Search publications, posts, projects, notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="search-input"
        />
      </div>

      {/* Filter chips */}
      {Object.keys(availableFilters).length > 0 && (
        <div className="search-filters">
          {renderFilterChips("type", "Content Type")}
          {renderFilterChips("year", "Year")}
          {renderFilterChips("maturity", "Maturity")}
          {renderFilterChips("keywords", "Keywords")}
        </div>
      )}

      {/* Results */}
      <div aria-live="polite" aria-atomic="true">
        {searched && (
          <p className="search-result-count">
            {resultCount === 0
              ? "No results found."
              : `${resultCount} result${resultCount !== 1 ? "s" : ""} found.`}
          </p>
        )}

        {results.length > 0 && (
          <ol className="search-results">
            {results.map((result) => (
              <li key={result.url} className="search-result-item">
                <a href={result.url} className="search-result-title">
                  {result.meta?.title ?? result.url}
                </a>
                {result.excerpt && (
                  <p
                    className="search-result-excerpt"
                    dangerouslySetInnerHTML={{ __html: result.excerpt }}
                  />
                )}
                <span className="search-result-url">{result.url}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
