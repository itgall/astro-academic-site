/**
 * DocumentRequest.tsx — CV/Resume request modal Island.
 *
 * Hydration: client:idle — enhancement for gated document access.
 *
 * Architecture:
 *   - Triggered by buttons with data-request-doc="resume|cv|both" attribute
 *   - Opens a modal with name, email, affiliation, and reason fields
 *   - Submits to /api/document-request (serverless function)
 *   - Shows success/error states within the modal
 *   - Uses event delegation so it works with any trigger button on any page
 *   - Keyboard accessible: Escape to close, Tab trapping within modal
 */
import { useState, useRef, useCallback, useEffect } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

export default function DocumentRequest() {
  const [isOpen, setIsOpen] = useState(false);
  const [docType, setDocType] = useState("resume");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [reason, setReason] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  /** Listen for trigger button clicks via event delegation */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const btn = (e.target as HTMLElement).closest(
        "[data-request-doc]",
      ) as HTMLElement | null;
      if (!btn) return;
      e.preventDefault();
      const doc = btn.getAttribute("data-request-doc") ?? "resume";
      setDocType(doc);
      setFormState("idle");
      setErrorMsg("");
      setIsOpen(true);
      setTimeout(() => nameRef.current?.focus(), 200);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setName("");
    setEmail("");
    setAffiliation("");
    setReason("");
  }, []);

  const submit = useCallback(async () => {
    if (!name.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setErrorMsg("");
    setFormState("submitting");

    try {
      const res = await fetch("/api/document-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          affiliation: affiliation.trim(),
          reason: reason.trim(),
          document: docType,
        }),
      });

      if (res.ok) {
        setFormState("success");
      } else {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setErrorMsg(data.error ?? "Submission failed. Please try again.");
        setFormState("error");
      }
    } catch {
      setErrorMsg("Connection error. Please try again.");
      setFormState("error");
    }
  }, [name, email, affiliation, reason, docType]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Enter" && formState === "idle") {
        e.preventDefault();
        submit();
      }
    },
    [close, submit, formState],
  );

  const docLabels: Record<string, string> = {
    resume: "Resume",
    cv: "Academic CV",
    both: "Resume + Academic CV",
  };

  if (!isOpen) return null;

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
        onClick={close}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-label="Request document access"
        aria-modal="true"
        onKeyDown={handleKeyDown}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(440px, calc(100vw - 48px))",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-glass)",
          overflow: "hidden",
          zIndex: 99999,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--color-text)",
                fontFamily: "var(--font-sans)",
              }}
            >
              Request document access
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--color-muted)",
                fontFamily: "var(--font-mono)",
                marginTop: "2px",
              }}
            >
              Document: {docLabels[docType] ?? docType}
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              color: "var(--color-muted)",
              cursor: "pointer",
              fontSize: "20px",
              padding: "4px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px" }}>
          {formState === "success" ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div
                style={{
                  fontSize: "28px",
                  color: "var(--color-accent)",
                  marginBottom: "12px",
                }}
              >
                ✓
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--color-text)",
                  fontFamily: "var(--font-sans)",
                  marginBottom: "8px",
                }}
              >
                Request submitted
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--color-muted)",
                  fontFamily: "var(--font-sans)",
                  lineHeight: 1.6,
                }}
              >
                You will receive an email with a download link once your request
                is approved.
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "14px" }}>
                <label
                  htmlFor="doc-req-name"
                  style={labelStyle}
                >
                  Name
                </label>
                <input
                  ref={nameRef}
                  id="doc-req-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label
                  htmlFor="doc-req-email"
                  style={labelStyle}
                >
                  Email
                </label>
                <input
                  id="doc-req-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@institution.edu"
                  autoComplete="email"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label
                  htmlFor="doc-req-affil"
                  style={labelStyle}
                >
                  Affiliation{" "}
                  <span style={{ color: "var(--color-muted)", fontSize: "11px" }}>
                    (optional)
                  </span>
                </label>
                <input
                  id="doc-req-affil"
                  type="text"
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  placeholder="University, company, or organization"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: "18px" }}>
                <label
                  htmlFor="doc-req-reason"
                  style={labelStyle}
                >
                  Reason{" "}
                  <span style={{ color: "var(--color-muted)", fontSize: "11px" }}>
                    (optional)
                  </span>
                </label>
                <input
                  id="doc-req-reason"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="PhD admissions, recruiting, collaboration..."
                  style={inputStyle}
                />
              </div>

              {errorMsg && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--color-danger)",
                    fontFamily: "var(--font-sans)",
                    marginBottom: "12px",
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={formState === "submitting"}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "var(--color-accent)",
                  color: "var(--color-bg)",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  fontSize: "14px",
                  fontWeight: 600,
                  fontFamily: "var(--font-sans)",
                  cursor:
                    formState === "submitting" ? "not-allowed" : "pointer",
                  opacity: formState === "submitting" ? 0.6 : 1,
                }}
              >
                {formState === "submitting"
                  ? "Submitting..."
                  : "Submit request"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Shared styles ────────────────────────────────────────────────────────── */

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 500,
  fontFamily: "var(--font-sans)",
  color: "var(--color-text-secondary)",
  marginBottom: "4px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  background: "var(--color-bg-off)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  color: "var(--color-text)",
  fontSize: "13px",
  fontFamily: "var(--font-sans)",
  outline: "none",
  boxSizing: "border-box",
};
