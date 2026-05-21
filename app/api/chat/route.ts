import { createAgentUIStreamResponse, ToolLoopAgent } from "ai";
import { google } from "@ai-sdk/google";
import { tools as baseTools } from "@/ai/tools";
import { webSearchTool } from "@/ai/web-search-tool";
import { SYSTEM_PROMPT } from "@/ai/system-prompt";

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, webSearch = false } = body as {
    messages: unknown[];
    webSearch?: boolean;
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
        console.warn("[chat] EMPTY STOP — agent returned nothing", {
          reason: e.finishReason,
          partCount,
          tokens: e.usage,
          warnings: e.warnings,
        });
      }
      // Always log basic step info for production debugging
      console.log("[chat step]", {
        reason: e.finishReason,
        parts: partCount,
        out,
      });
    }) as never,
  } as never);
}
