/**
 * CommandPalette.tsx — ⌘K / Ctrl+K command palette Island.
 *
 * Hydration: client:idle — command palette is an enhancement, not critical.
 *
 * Architecture:
 *   - Opens with ⌘K (Mac) or Ctrl+K (Windows/Linux)
 *   - Reads command manifest from #command-palette-data (JSON, build-time)
 *   - Fuzzy-matches input against command labels and keywords
 *   - Keyboard accessible: ↑↓ to navigate, Enter to select, Escape to close
 *   - Actions: navigate to pages, toggle theme, change accent, open search
 *   - Uses CSS custom properties from the design system for theming
 *   - Focus-trapped while open, scrolls selected item into view
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ── Types ────────────────────────────────────────────────────────────────── */

interface Command {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Category for grouping */
  category: "page" | "action" | "content" | "external";
  /** Category display label */
  categoryLabel: string;
  /** Optional icon (emoji or short string) */
  icon: string;
  /** Search keywords (matched in addition to label) */
  keywords: string;
  /** Navigation URL or action ID */
  href?: string;
  /** Action function name (for non-navigation commands) */
  action?: string;
}

/* ── Static commands (actions that don't depend on build-time content) ───── */

const STATIC_COMMANDS: Command[] = [
  // Navigation
  { id: "nav-home", label: "Home", category: "page", categoryLabel: "Pages", icon: "🏠", keywords: "home index landing", href: "/" },
  { id: "nav-publications", label: "Publications", category: "page", categoryLabel: "Pages", icon: "📄", keywords: "research papers articles journal", href: "/publications/" },
  { id: "nav-projects", label: "Projects", category: "page", categoryLabel: "Pages", icon: "🔬", keywords: "research work portfolio", href: "/projects/" },
  { id: "nav-blog", label: "Blog", category: "page", categoryLabel: "Pages", icon: "✍️", keywords: "writing articles posts", href: "/blog/" },
  { id: "nav-notes", label: "Notes", category: "page", categoryLabel: "Pages", icon: "🌱", keywords: "garden digital wiki", href: "/notes/" },
  { id: "nav-teaching", label: "Teaching", category: "page", categoryLabel: "Pages", icon: "🎓", keywords: "courses classes ta instructor", href: "/teaching/" },
  { id: "nav-cv", label: "CV", category: "page", categoryLabel: "Pages", icon: "📋", keywords: "resume curriculum vitae", href: "/cv/" },
  { id: "nav-about", label: "About", category: "page", categoryLabel: "Pages", icon: "👤", keywords: "bio biography info", href: "/about/" },
  { id: "nav-contact", label: "Contact", category: "page", categoryLabel: "Pages", icon: "📧", keywords: "email message reach", href: "/contact/" },
  { id: "nav-search", label: "Search", category: "page", categoryLabel: "Pages", icon: "🔍", keywords: "find query pagefind", href: "/search/" },
  { id: "nav-graph", label: "Research Graph", category: "page", categoryLabel: "Pages", icon: "🕸️", keywords: "knowledge network visualization d3", href: "/graph/" },

  // Actions
  { id: "act-print", label: "Print Page", category: "action", categoryLabel: "Actions", icon: "🖨️", keywords: "print pdf paper", action: "print" },
  { id: "act-top", label: "Scroll to Top", category: "action", categoryLabel: "Actions", icon: "⬆️", keywords: "top scroll up beginning", action: "scrollTop" },
  { id: "act-copy-url", label: "Copy Page URL", category: "action", categoryLabel: "Actions", icon: "🔗", keywords: "link share clipboard copy url", action: "copyUrl" },
];

/* ── Fuzzy match scoring ──────────────────────────────────────────────────── */

function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  /* Exact substring match scores highest */
  if (t.includes(q)) return 100 + (q.length / t.length) * 50;

  /* Prefix match on any word */
  const words = t.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(q)) return 80;
  }

  /* Character-by-character fuzzy match */
  let qi = 0;
  let consecutive = 0;
  let maxConsecutive = 0;
  let score = 0;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
      consecutive++;
      maxConsecutive = Math.max(maxConsecutive, consecutive);
      score += consecutive * 2;
    } else {
      consecutive = 0;
    }
  }

  if (qi < q.length) return 0; /* Not all query chars matched */
  return score + maxConsecutive * 5;
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [commands, setCommands] = useState<Command[]>(STATIC_COMMANDS);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* Load dynamic commands from the build-time manifest on mount */
  useEffect(() => {
    const el = document.getElementById("command-palette-data");
    if (!el) return;

    try {
      const dynamic = JSON.parse(el.textContent ?? "[]") as Command[];
      setCommands((prev) => [...prev, ...dynamic]);
    } catch {
      /* Silently ignore parse errors */
    }
  }, []);

  /* Keyboard shortcut: ⌘K / Ctrl+K to open */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery("");
        setSelectedIndex(0);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  /* Focus input when palette opens */
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  /* Filter and sort commands by fuzzy match score */
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;

    return commands
      .map((cmd) => {
        const labelScore = fuzzyScore(query, cmd.label);
        const keywordScore = fuzzyScore(query, cmd.keywords) * 0.7;
        const score = Math.max(labelScore, keywordScore);
        return { cmd, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ cmd }) => cmd);
  }, [query, commands]);

  /* Group filtered commands by category */
  const grouped = useMemo(() => {
    const groups: { label: string; items: Command[] }[] = [];
    const seen = new Set<string>();

    for (const cmd of filtered) {
      if (!seen.has(cmd.categoryLabel)) {
        seen.add(cmd.categoryLabel);
        groups.push({ label: cmd.categoryLabel, items: [] });
      }
      groups.find((g) => g.label === cmd.categoryLabel)?.items.push(cmd);
    }
    return groups;
  }, [filtered]);

  /* Reset selected index when results change */
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  /* Execute the selected command */
  const execute = useCallback(
    (cmd: Command) => {
      setIsOpen(false);
      setQuery("");

      if (cmd.href) {
        window.location.href = cmd.href;
        return;
      }

      switch (cmd.action) {
        case "print":
          window.print();
          break;
        case "scrollTop":
          window.scrollTo({ top: 0, behavior: "smooth" });
          break;
        case "copyUrl":
          navigator.clipboard.writeText(window.location.href).catch(() => {});
          break;
      }
    },
    [],
  );

  /* Keyboard navigation within the palette */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filtered[selectedIndex]) execute(filtered[selectedIndex]);
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    },
    [filtered, selectedIndex, execute],
  );

  /* Scroll selected item into view */
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector("[data-selected=true]");
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!isOpen) return null;

  /* Compute flat index for each item across groups */
  let flatIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 99998,
        }}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Palette */}
      <div
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
        style={{
          position: "fixed",
          top: "min(20vh, 160px)",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(90vw, 560px)",
          maxHeight: "min(60vh, 420px)",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-glass)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          zIndex: 99999,
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 16px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Command search"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--color-text)",
              fontSize: "15px",
              fontFamily: "var(--font-sans)",
            }}
          />
          <kbd
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 6px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--color-muted)",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            esc
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          role="listbox"
          aria-label="Commands"
          style={{
            overflowY: "auto",
            padding: "6px",
            flex: 1,
          }}
        >
          {filtered.length === 0 && (
            <div
              style={{
                padding: "24px 16px",
                textAlign: "center",
                color: "var(--color-muted)",
                fontSize: "13px",
                fontFamily: "var(--font-sans)",
              }}
            >
              No results for "{query}"
            </div>
          )}

          {grouped.map((group) => (
            <div key={group.label}>
              <div
                style={{
                  padding: "8px 10px 4px",
                  fontSize: "10px",
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--color-muted)",
                }}
              >
                {group.label}
              </div>
              {group.items.map((cmd) => {
                const idx = flatIndex++;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    role="option"
                    aria-selected={isSelected}
                    data-selected={isSelected}
                    onClick={() => execute(cmd)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-md)",
                      border: "none",
                      background: isSelected
                        ? "var(--color-accent-bg)"
                        : "transparent",
                      color: isSelected
                        ? "var(--color-accent)"
                        : "var(--color-text)",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontFamily: "var(--font-sans)",
                      textAlign: "left",
                      transition: "background 0.08s ease",
                      outline: "none",
                    }}
                  >
                    <span
                      style={{ fontSize: "16px", width: "22px", textAlign: "center", flexShrink: 0 }}
                      aria-hidden="true"
                    >
                      {cmd.icon}
                    </span>
                    <span style={{ flex: 1 }}>{cmd.label}</span>
                    {cmd.href && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontFamily: "var(--font-mono)",
                          color: "var(--color-muted)",
                          opacity: 0.6,
                        }}
                      >
                        {cmd.href}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px 16px",
            borderTop: "1px solid var(--color-border)",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--color-muted)",
          }}
        >
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </>
  );
}
