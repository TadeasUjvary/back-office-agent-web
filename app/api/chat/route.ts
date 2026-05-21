import { createAgentUIStreamResponse, ToolLoopAgent } from "ai";
import { google } from "@ai-sdk/google";
import { tools as baseTools } from "@/ai/tools";
import { webSearchTool } from "@/ai/web-search-tool";
import { SYSTEM_PROMPT } from "@/ai/system-prompt";
import { getOrCreateUserConversation, saveMessages } from "@/lib/db/conversations";

export const maxDuration = 60;

type UIPart = {
  type: string;
  text?: string;
  state?: string;
};
type UIMsg = { id: string; role: "user" | "assistant" | "system"; parts: UIPart[] };

/**
 * Sanitize messages before sending to Gemini.
 * - Drop assistant messages with no text and no completed tool result
 *   (orphaned tool calls from failed previous turns trigger
 *   "function call turn must come after a user turn" errors).
 * - Drop messages with empty parts.
 */
function sanitizeMessages(messages: UIMsg[]): UIMsg[] {
  return messages.filter((m) => {
    if (!m.parts || m.parts.length === 0) return false;
    if (m.role === "assistant") {
      const hasText = m.parts.some(
        (p) => p.type === "text" && typeof p.text === "string" && p.text.trim().length > 0,
      );
      const hasCompletedTool = m.parts.some(
        (p) => p.type?.startsWith("tool-") && p.state === "output-available",
      );
      // Drop assistant turn that has only stray tool-call without output
      if (!hasText && !hasCompletedTool) return false;
    }
    return true;
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, webSearch = false } = body as {
    messages: UIMsg[];
    webSearch?: boolean;
  };
  const userId = decodeURIComponent(req.headers.get("x-user-id") ?? "").trim();

  // Resolve user's single conversation (auto-create if needed)
  let conversationId: string | null = null;
  if (userId) {
    try {
      const conv = await getOrCreateUserConversation(userId);
      conversationId = conv.id;
    } catch (e) {
      console.warn("[chat] could not resolve conversation", e);
    }
  }

  const cleanMessages = sanitizeMessages(messages);

  const tools = webSearch
    ? ({ ...baseTools, webSearch: webSearchTool } as const)
    : baseTools;

  const agent = new ToolLoopAgent({
    model: google("gemini-2.5-flash"),
    instructions: SYSTEM_PROMPT,
    tools,
  });

  return createAgentUIStreamResponse({
    agent,
    uiMessages: cleanMessages as never,
    onStepFinish: ((event: unknown) => {
      const e = event as {
        finishReason?: string;
        content?: unknown[];
        usage?: { outputTokens?: number; inputTokens?: number };
        warnings?: unknown[];
      };
      const partCount = e.content?.length ?? 0;
      const out = e.usage?.outputTokens ?? 0;
      if (e.finishReason === "stop" && partCount === 0 && out === 0) {
        console.warn("[chat] EMPTY STOP", { warnings: e.warnings });
      }
      console.log("[chat step]", { reason: e.finishReason, parts: partCount, out });
    }) as never,
    onFinish: (async (event: unknown) => {
      if (!conversationId) return;
      try {
        const e = event as { messages?: UIMsg[] };
        const all = e.messages ?? [];
        await saveMessages(
          conversationId,
          all.map((m) => ({ id: m.id, role: m.role, parts: m.parts })),
        );
      } catch (err) {
        console.error("[chat] persist failed", err);
      }
    }) as never,
  } as never);
}
