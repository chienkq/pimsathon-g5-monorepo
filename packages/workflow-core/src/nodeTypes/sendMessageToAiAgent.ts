import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";

export const sendMessageToAiAgentNodeType: NodeTypeDefinition = {
  type: "sendMessageToAiAgent",
  displayName: "Send Message to AI Agent",
  description: "Sends a message to an AI agent and returns its response.",
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
      placeholder: "e.g. support-agent",
      required: true,
    },
    {
      key: "message",
      label: "Message",
      type: "code",
      default: "",
      helpText: "The prompt/message sent to the agent for each input item.",
      required: true,
    },
  ],
  async execute({ parameters, input }) {
    const agentName = String(parameters.agentName ?? "");
    const message = String(parameters.message ?? "");
    const items = input.length > 0 ? input : [{ json: {} }];
    const output: NodeExecutionData[] = items.map((item) => ({
      json: { ...item.json, agentName, message, response: `[stub] ${agentName || "agent"} received: ${message}` },
    }));
    return { branches: { main: output } };
  },
};
