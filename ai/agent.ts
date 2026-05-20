import { ToolLoopAgent, InferAgentUIMessage } from "ai";
import { google } from "@ai-sdk/google";
import { SYSTEM_PROMPT } from "./system-prompt";
import { tools } from "./tools";

export const backOfficeAgent = new ToolLoopAgent({
  model: google("gemini-2.5-flash"),
  instructions: SYSTEM_PROMPT,
  tools,
});

export type BackOfficeUIMessage = InferAgentUIMessage<typeof backOfficeAgent>;
