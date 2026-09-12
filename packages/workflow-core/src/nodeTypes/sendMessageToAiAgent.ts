import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";

/**
 * Injected via `executeWorkflow(workflow, { services: { llmClient } })` — backend's real provider
 * client (`apps/backend/src/llmClient.ts`), which resolves `agentName` against a named row on the
 * "LLM Settings" screen (`llm_configs` table, see `llm.ts`) and calls that provider for real. `context`
 * is whatever JSON this node's current input item carries — the backend truncates it before it's sent
 * to the provider, since a git-file-contents-heavy input can be arbitrarily large.
 */
export interface AiAgentLlmService {
  complete(agentName: string, input: { message: string; context: unknown }): Promise<string>;
}

export const sendMessageToAiAgentNodeType: NodeTypeDefinition = {
  type: "sendMessageToAiAgent",
  displayName: "Send Message to AI Agent",
  description:
    "Sends a message plus this item's JSON as context to a named LLM Config (Settings → LLM Settings) and returns its real text response.",
  group: "ai",
  color: "#7b2cbf",
  hasInput: true,
  outputs: ["main"],
  parameters: [
    {
      key: "agentName",
      label: "Agent",
      type: "string",
      default: "",
      placeholder: "e.g. cycle-health-analyst",
      helpText: "Must match the Name of an LLM Config configured in Settings → LLM Settings.",
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
    const agentName = String(parameters.agentName ?? "");
    const message = String(parameters.message ?? "");
    const runMode = String(parameters.runMode ?? "perItem");
    if (!agentName) throw new Error("Send Message to AI Agent requires an Agent (an LLM Config name).");
    const llmClient = services?.llmClient as AiAgentLlmService | undefined;
    if (!llmClient)
      throw new Error("Send Message to AI Agent requires an `llmClient` service (only available in backend).");

    const items = input.length > 0 ? input : [{ json: {} }];

    if (runMode === "batch") {
      const response = await llmClient.complete(agentName, { message, context: items.map((item) => item.json) });
      return { branches: { main: [{ json: { agentName, message, runMode, response } }] } };
    }

    const output: NodeExecutionData[] = [];
    for (const item of items) {
      const response = await llmClient.complete(agentName, { message, context: item.json });
      output.push({ json: { ...item.json, agentName, message, runMode, response } });
    }
    return { branches: { main: output } };
  },
};
