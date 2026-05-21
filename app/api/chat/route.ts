import { createAgentUIStreamResponse, ToolLoopAgent } from "ai";
import { google } from "@ai-sdk/google";
import { tools as baseTools } from "@/ai/tools";
import { webSearchTool } from "@/ai/web-search-tool";
import { SYSTEM_PROMPT } from "@/ai/system-prompt";
import { saveMessages } from "@/lib/db/conversations";

export const maxDuration = 60;

type UIMsg = { id: string; role: "user" | "assistant" | "system"; parts: unknown[] };

export async function POST(req: Request) {
  const body = await req.json();
  const {
    messages,
    webSearch = false,
    conversationId,
  } = body as {
    messages: UIMsg[];
    webSearch?: boolean;
    conversationId?: string;
  };

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
    uiMessages: messages,
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
        // Persist all messages (user + assistant) — upsert by id
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
