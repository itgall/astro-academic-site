/**
 * latex.ts — LaTeX Special Character Converter.
 *
 * Converts LaTeX special characters and commands to Unicode for display
 * in HTML. Essential because BibTeX fields (titles, author names, abstracts)
 * frequently contain LaTeX markup that must render correctly in the browser.
 *
 * Coverage: 10+ accent types (~100 precomposed characters), 13 named characters,
 * 7 escaped specials, text command stripping, math mode stripping, dash
 * conversion, non-breaking space handling, and protective brace removal.
 *
 * @module
 */

/* ── Accent mappings ──────────────────────────────────────────────────────── */

/**
 * Maps LaTeX accent command characters to base-character → precomposed-Unicode
 * lookup tables. Handles both \"{o} (braced) and \"o (bare) forms.
 */
const ACCENT_MAP: Record<string, Record<string, string>> = {
  '"': {
    a: "ä", A: "Ä", e: "ë", E: "Ë", i: "ï", I: "Ï",
    o: "ö", O: "Ö", u: "ü", U: "Ü", y: "ÿ", Y: "Ÿ",
  },
  "'": {
    a: "á", A: "Á", e: "é", E: "É", i: "í", I: "Í",
    o: "ó", O: "Ó", u: "ú", U: "Ú", y: "ý", Y: "Ý",
    c: "ć", C: "Ć", n: "ń", N: "Ń", s: "ś", S: "Ś",
    z: "ź", Z: "Ź", l: "ĺ", L: "Ĺ", r: "ŕ", R: "Ŕ",
  },
  "`": {
    a: "à", A: "À", e: "è", E: "È", i: "ì", I: "Ì",
    o: "ò", O: "Ò", u: "ù", U: "Ù",
  },
  "^": {
    a: "â", A: "Â", e: "ê", E: "Ê", i: "î", I: "Î",
    o: "ô", O: "Ô", u: "û", U: "Û", c: "ĉ", C: "Ĉ",
    s: "ŝ", S: "Ŝ", w: "ŵ", W: "Ŵ", y: "ŷ", Y: "Ŷ",
  },
  "~": {
    a: "ã", A: "Ã", n: "ñ", N: "Ñ", o: "õ", O: "Õ",
    i: "ĩ", I: "Ĩ", u: "ũ", U: "Ũ",
  },
  v: {
    c: "č", C: "Č", s: "š", S: "Š", z: "ž", Z: "Ž",
    r: "ř", R: "Ř", d: "ď", D: "Ď", n: "ň", N: "Ň",
    t: "ť", T: "Ť", e: "ě", E: "Ě", a: "ǎ", A: "Ǎ",
  },
  u: {
    a: "ă", A: "Ă", g: "ğ", G: "Ğ", i: "ĭ", I: "Ĭ",
    o: "ŏ", O: "Ŏ", u: "ŭ", U: "Ŭ",
  },
  ".": {
    z: "ż", Z: "Ż", c: "ċ", C: "Ċ", g: "ġ", G: "Ġ",
    I: "İ", e: "ė", E: "Ė",
  },
  c: {
    c: "ç", C: "Ç", s: "ş", S: "Ş", t: "ţ", T: "Ţ",
    e: "ȩ", E: "Ȩ",
  },
  H: { o: "ő", O: "Ő", u: "ű", U: "Ű" },
  k: {
    a: "ą", A: "Ą", e: "ę", E: "Ę", i: "į", I: "Į",
    o: "ǫ", O: "Ǫ", u: "ų", U: "Ų",
  },
  r: { a: "å", A: "Å", u: "ů", U: "Ů" },
  "=": {
    a: "ā", A: "Ā", e: "ē", E: "Ē", i: "ī", I: "Ī",
    o: "ō", O: "Ō", u: "ū", U: "Ū",
  },
};

/* ── Special character commands ───────────────────────────────────────────── */

const SPECIAL_COMMANDS: Array<[RegExp, string]> = [
  [/\\aa\b/g, "å"], [/\\AA\b/g, "Å"],
  [/\\ae\b/g, "æ"], [/\\AE\b/g, "Æ"],
  [/\\oe\b/g, "œ"], [/\\OE\b/g, "Œ"],
  [/\\o\b/g, "ø"],  [/\\O\b/g, "Ø"],
  [/\\ss\b/g, "ß"],
  [/\\l\b/g, "ł"],  [/\\L\b/g, "Ł"],
  [/\\i\b/g, "ı"],  [/\\j\b/g, "ȷ"],
  /* Escaped specials */
  [/\\&/g, "&"], [/\\%/g, "%"], [/\\\$/g, "$"],
  [/\\#/g, "#"], [/\\_/g, "_"], [/\\{/g, "{"], [/\\}/g, "}"],
  [/\\\\/g, ""],
];

/* ── Text formatting commands to strip ────────────────────────────────────── */

const TEXT_COMMANDS = [
  "textbf", "textit", "textrm", "texttt", "textsf", "textsc",
  "emph", "mathbf", "mathit", "mathrm", "mathsf", "mathtt",
  "bfseries", "itshape", "rmfamily", "ttfamily", "sffamily", "scshape",
  "bf", "it", "rm", "tt", "sf", "sc", "em",
];

/**
 * Clean LaTeX markup from a string, converting to Unicode.
 *
 * Processing order:
 *   1. Accent commands (before brace removal)
 *   2. Special commands (\ss, \ae, etc.)
 *   3. Text formatting commands (\textbf{...} → content)
 *   4. Math mode ($...$, \(...\))
 *   5. Dashes (--- → —, -- → –)
 *   6. Non-breaking spaces (~ → \u00A0)
 *   7. Protective braces ({NASA} → NASA)
 *   8. Whitespace collapse
 */
export function cleanLatex(input: string): string {
  if (!input) return "";
  let s = input;

  /* 1. Accent commands */
  for (const [cmd, charMap] of Object.entries(ACCENT_MAP)) {
    const esc = cmd.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    /* Braced: \"{o} or \v{c} */
    s = s.replace(
      new RegExp(`\\\\${esc}\\{([^}])\\}`, "g"),
      (_m, ch: string) => charMap[ch] ?? ch,
    );
    /* Bare: \"o (single-char commands only) */
    if (cmd.length === 1) {
      s = s.replace(
        new RegExp(`\\\\${esc}([A-Za-z])`, "g"),
        (_m, ch: string) => charMap[ch] ?? ch,
      );
    }
  }

  /* 2. Special commands */
  for (const [re, rep] of SPECIAL_COMMANDS) {
    s = s.replace(re, rep);
  }

  /* 3. Text formatting commands */
  for (const cmd of TEXT_COMMANDS) {
    s = s.replace(new RegExp(`\\\\${cmd}\\{([^}]*)\\}`, "g"), "$1");
    s = s.replace(new RegExp(`\\{\\\\${cmd}\\s+([^}]*)\\}`, "g"), "$1");
  }

  /* 4. Math mode */
  s = s.replace(/\$([^$]+)\$/g, "$1");
  s = s.replace(/\\\(([^)]+)\\\)/g, "$1");

  /* 5. Dashes — longest first */
  s = s.replace(/---/g, "—");
  s = s.replace(/--/g, "–");

  /* 6. Non-breaking space (unescaped ~ only) */
  s = s.replace(/(?<!\\)~/g, "\u00A0");

  /* 7. Protective braces — iterative for nesting */
  let prev = "";
  while (prev !== s) {
    prev = s;
    s = s.replace(/\{([^{}]*)\}/g, "$1");
  }

  /* 8. Whitespace collapse */
  s = s.replace(/\s+/g, " ").trim();

  return s;
}
