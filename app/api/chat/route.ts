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
  });
}
