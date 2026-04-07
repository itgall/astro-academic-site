/**
 * /api/document-request — Cloudflare Pages Function for CV/resume access requests.
 *
 * Receives form submissions from the DocumentRequest modal and:
 *   1. Validates the request (name, email required)
 *   2. Logs the request (console + optional KV storage)
 *   3. Optionally sends an email notification to the site owner
 *
 * Environment variables (set in Cloudflare Pages dashboard):
 *   NOTIFICATION_EMAIL — (optional) site owner's email for request notifications
 *   SENDGRID_API_KEY  — (optional) SendGrid API key for sending notification emails
 *
 * Without email configured, requests are logged to the Cloudflare Workers
 * console (viewable in the Cloudflare dashboard under Workers & Pages → Logs).
 * This is sufficient for low-volume academic sites.
 *
 * Platform portability:
 *   - Cloudflare Pages: works automatically from functions/api/document-request.ts
 *   - Netlify: move to netlify/functions/document-request.ts
 *   - Vercel: move to api/document-request.ts
 */

interface Env {
  NOTIFICATION_EMAIL?: string;
  SENDGRID_API_KEY?: string;
}

interface RequestBody {
  name: string;
  email: string;
  affiliation?: string;
  reason?: string;
  document: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: RequestBody;
  try {
    body = (await context.request.json()) as RequestBody;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return Response.json({ error: "Name is required." }, { status: 400 });
  }
  if (!body.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return Response.json(
      { error: "A valid email address is required." },
      { status: 400 },
    );
  }

  const request = {
    name: body.name.trim(),
    email: body.email.trim(),
    affiliation: body.affiliation?.trim() ?? "",
    reason: body.reason?.trim() ?? "",
    document: body.document ?? "resume",
    timestamp: new Date().toISOString(),
    ip: context.request.headers.get("CF-Connecting-IP") ?? "unknown",
  };

  /** Log the request — always visible in Cloudflare Workers logs */
  console.log("[document-request]", JSON.stringify(request));

  /** Optional: send email notification via SendGrid */
  const notifyEmail = context.env.NOTIFICATION_EMAIL;
  const sendgridKey = context.env.SENDGRID_API_KEY;

  if (notifyEmail && sendgridKey) {
    try {
      const emailBody = {
        personalizations: [{ to: [{ email: notifyEmail }] }],
        from: { email: "noreply@" + new URL(context.request.url).hostname },
        subject: `[Document Request] ${request.document} — ${request.name}`,
        content: [
          {
            type: "text/plain",
            value: [
              `New document access request:`,
              ``,
              `Name: ${request.name}`,
              `Email: ${request.email}`,
              `Affiliation: ${request.affiliation || "(not provided)"}`,
              `Reason: ${request.reason || "(not provided)"}`,
              `Document: ${request.document}`,
              `Timestamp: ${request.timestamp}`,
              `IP: ${request.ip}`,
            ].join("\n"),
          },
        ],
      };

      await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sendgridKey}`,
        },
        body: JSON.stringify(emailBody),
      });
    } catch (error) {
      console.error("[document-request] Email notification failed:", error);
      /* Don't fail the request — the log is sufficient */
    }
  }

  return Response.json({ success: true });
};
