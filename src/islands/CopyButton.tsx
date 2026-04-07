/**
 * CopyButton.tsx — Copy-to-clipboard Island.
 *
 * Hydration: client:idle — non-critical interactive enhancement.
 * Justification: Copy-to-clipboard is not needed on initial load;
 * it can safely wait for the browser's idle period.
 *
 * Used for BibTeX entry and APA citation copy on publication pages.
 * Visual feedback: button text briefly changes to "Copied ✓" for 2 seconds.
 */
import { useState } from "react";

interface CopyButtonProps {
  /** Content to copy to clipboard */
  text: string;
  /** Button label (default: "Copy") */
  label?: string;
}

export default function CopyButton({ text, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /*
       * Clipboard API unavailable (e.g., insecure context, denied permission).
       * Fail silently — the button simply won't change state.
       */
    }
  }

  return (
    <button
      onClick={handleCopy}
      type="button"
      aria-label={copied ? "Copied to clipboard" : `Copy ${label} to clipboard`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.375rem",
        padding: "0.25rem 0.625rem",
        borderRadius: "0.25rem",
        border: `1px solid ${copied ? "var(--color-success, #22c55e)" : "var(--color-border)"}`,
        fontFamily: "var(--font-mono, ui-monospace, monospace)",
        fontSize: "0.6875rem",
        lineHeight: "1",
        color: copied ? "var(--color-success, #22c55e)" : "var(--color-muted)",
        background: "transparent",
        cursor: "pointer",
        transition: "color 0.15s, border-color 0.15s",
      }}
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
