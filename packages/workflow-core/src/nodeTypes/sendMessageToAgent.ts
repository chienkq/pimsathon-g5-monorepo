import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";

/**
 * Injected via `executeWorkflow(workflow, { services: { agentClient } })` — backend's real agent
 * client (`apps/backend/src/llmClient.ts`), which resolves `agentId` against a row on the "AI Agents"
 * screen (Settings → AI Agents), runs it against its assigned LLM Config, and lets it call its
 * assigned Tools before answering. `context` is whatever JSON this node's current input item carries —
 * the backend truncates it before it's sent to the provider, since a git-file-contents-heavy input
 * can be arbitrarily large.
 */
/** One tool-call round-trip the agent made while working toward its final answer — see
 *  `apps/backend/src/llmAgentRunner.ts`'s `AgentRoundTrip`. Kept as `unknown[]` here so
 *  workflow-core doesn't need to depend on the backend's concrete shape; the node just passes it
 *  through to its output for the NDV to render. */
export type AgentTraceEntry = unknown;

export interface SendMessageToAgentResult {
  response: string;
  /** Empty when the agent answered without calling any tools (or its provider doesn't support tool calling). */
  trace: AgentTraceEntry[];
}

export interface SendMessageToAgentService {
  complete(agentId: string, input: { message: string; context: unknown }): Promise<SendMessageToAgentResult>;
}

export const sendMessageToAgentNodeType: NodeTypeDefinition = {
  type: "sendMessageToAgent",
  displayName: "Send Message to Agent",
  description:
    "Sends a message plus this item's JSON as context to an AI Agent (Settings → AI Agents) — its Markdown content becomes the system prompt, and it may call its assigned Tools before returning a final answer.",
  group: "ai",
  color: "#7b2cbf",
  hasInput: true,
  outputs: ["main"],
  parameters: [
    {
      key: "agentId",
      label: "Agent",
      type: "select",
      default: "",
      dynamicOptions: "aiAgents",
      helpText: "Pick one of the AI Agents configured in Settings → AI Agents.",
      required: true,
    },
    {
      key: "message",
      label: "Message",
      type: "code",
      default: "",
      helpText: "The instruction sent to the agent for each input item, alongside that item's own JSON as context.",
      required: true,
    },
    {
      key: "runMode",
      label: "Run Mode",
      type: "select",
      default: "perItem",
      options: [
        { label: "Per Item (sequential)", value: "perItem" },
        { label: "All Items (single batch call)", value: "batch" },
      ],
      helpText:
        "Per Item calls the agent once per input item, one after another. All Items sends every input item's JSON together as context in a single agent call.",
    },
  ],
  async execute({ parameters, input, services }) {
    const agentId = String(parameters.agentId ?? "");
    const message = String(parameters.message ?? "");
    const runMode = String(parameters.runMode ?? "perItem");
    if (!agentId) throw new Error("Send Message to Agent requires an Agent to be selected.");
    const agentClient = services?.agentClient as SendMessageToAgentService | undefined;
    if (!agentClient)
      throw new Error("Send Message to Agent requires an `agentClient` service (only available in backend).");

    const items = input.length > 0 ? input : [{ json: {} }];

    if (runMode === "batch") {
      const result = await agentClient.complete(agentId, { message, context: items.map((item) => item.json) });
      return {
        branches: {
          main: [{ json: { agentId, message, runMode, response: result.response, agentTrace: result.trace } }],
        },
      };
    }

    const output: NodeExecutionData[] = [];
    for (const item of items) {
      const result = await agentClient.complete(agentId, { message, context: item.json });
      output.push({
        json: { ...item.json, agentId, message, runMode, response: result.response, agentTrace: result.trace },
      });
    }
    return { branches: { main: output } };
  },
};
