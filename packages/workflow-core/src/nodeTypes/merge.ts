import type { NodeTypeDefinition } from "../types.js";

export const mergeNodeType: NodeTypeDefinition = {
  type: "merge",
  displayName: "Merge",
  description: "Joins items from multiple incoming connections into one list.",
  group: "logic",
  color: "#495057",
  hasInput: true,
  outputs: ["main"],
  parameters: [],
  async execute({ input }) {
    return { branches: { main: input } };
  },
};
