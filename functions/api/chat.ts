/**
 * /api/chat — Cloudflare Pages Function for AI chat.
 *
 * Proxies chat requests to the Anthropic Messages API with a system prompt
 * that provides context about the site owner's research, publications,
 * and background. The system prompt is defined below and should be
 * customized when setting up the template.
 *
 * Environment variables required (set in Cloudflare Pages dashboard):
 *   ANTHROPIC_API_KEY — Your Anthropic API key
 *
 * The function:
 *   1. Validates the request (POST, JSON body, messages array)
 *   2. Prepends a system prompt with site context
 *   3. Calls the Anthropic Messages API
 *   4. Returns the assistant's reply as JSON
 *
 * Rate limiting: Cloudflare Pages Functions have a 100,000 requests/day
 * free tier limit. For a personal academic site this is more than sufficient.
 *
 * Platform portability:
 *   - Cloudflare Pages: works automatically from functions/api/chat.ts
 *   - Netlify: move to netlify/functions/chat.ts, adjust handler signature
 *   - Vercel: move to api/chat.ts, adjust to use Vercel's edge function format
 *   - See README for migration instructions
 */

interface Env {
  ANTHROPIC_API_KEY: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
}

/**
 * System prompt — provides site context to the AI assistant.
 *
 * ⚠️  Customize this when setting up the template. Replace the placeholder
 * text with real information about the site owner's research, publications,
 * education, and background. The more specific the context, the better
 * the assistant's answers will be.
 */
const SYSTEM_PROMPT = `You are a helpful AI assistant for an academic researcher's personal website. Your role is to answer questions about the site owner's research, publications, projects, technical background, and professional experience.

Be concise, accurate, and friendly. If you don't know something specific about the site owner, say so honestly rather than making up information. You can discuss general topics in the site owner's research areas, but always clarify when you're speaking generally vs. about their specific work.

Keep responses brief — 2-3 sentences for simple questions, up to a paragraph for complex ones. Use plain language accessible to both experts and general audiences.

The site owner's information (customize this section with your real data):
- Name: [Your Name]
- Role: [Your Title] at [Your Institution]
- Research areas: [Your research interests]
- Education: [Your degrees]
- Key publications: [Brief list of notable publications]

If asked about topics outside the site owner's expertise, you can provide general knowledge but note that it's not the site owner's area of focus.`;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        error:
          "AI chat is not configured. The site owner needs to set the ANTHROPIC_API_KEY environment variable.",
      },
      { status: 503 },
    );
  }

  let body: RequestBody;
  try {
    body = (await context.request.json()) as RequestBody;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json(
      { error: "Messages array is required." },
      { status: 400 },
    );
  }

  /** Limit conversation length to prevent abuse and control costs */
  const MAX_MESSAGES = 20;
  const trimmedMessages = body.messages.slice(-MAX_MESSAGES);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: trimmedMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Anthropic API error: ${response.status} ${errorText}`);
      return Response.json(
        { error: "AI service temporarily unavailable. Please try again later." },
        { status: 502 },
      );
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text?: string }>;
    };

    const reply = data.content
      .filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join("");

    return Response.json({ reply });
  } catch (error) {
    console.error("Chat proxy error:", error);
    return Response.json(
      { error: "Failed to reach AI service. Please try again." },
      { status: 500 },
    );
  }
};
