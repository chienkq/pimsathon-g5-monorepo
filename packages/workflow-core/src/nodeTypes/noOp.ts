import type { NodeTypeDefinition } from "../types.js";

export const noOpNodeType: NodeTypeDefinition = {
  type: "noOp",
  displayName: "No Operation",
  description: "Passes items through unchanged. Useful as a workflow end marker.",
  group: "action",
  color: "#6c757d",
  hasInput: true,
  outputs: ["main"],
  parameters: [],
  async execute({ input }) {
    return { branches: { main: input } };
  },
};
