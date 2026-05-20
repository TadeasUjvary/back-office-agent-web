import { createAgentUIStreamResponse } from "ai";
import { backOfficeAgent } from "@/ai/agent";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();
  return createAgentUIStreamResponse({
    agent: backOfficeAgent,
    uiMessages: messages,
  });
}
