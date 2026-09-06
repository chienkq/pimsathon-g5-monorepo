import type { NodeTypeDefinition } from "../types.js";

export const manualTriggerNodeType: NodeTypeDefinition = {
  type: "manualTrigger",
  displayName: "Manual Trigger",
  description: 'Starts the workflow when you click "Run".',
  group: "trigger",
  color: "#ff6d5a",
  hasInput: false,
  outputs: ["main"],
  parameters: [],
  async execute() {
    return { branches: { main: [{ json: {} }] } };
  },
};
