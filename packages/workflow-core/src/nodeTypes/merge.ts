import type { NodeExecuteInputGroup, NodeTypeDefinition } from "../types.js";

export const mergeNodeType: NodeTypeDefinition = {
  type: "merge",
  displayName: "Merge",
  description: "Joins items from multiple incoming connections into one list.",
  group: "flow",
  color: "#495057",
  hasInput: true,
  inputs: ["input1", "input2"],
  outputs: ["main"],
  parameters: [
    {
      key: "mode",
      label: "Mode",
      type: "select",
      default: "append",
      options: [
        { label: "Append", value: "append" },
        { label: "Combine", value: "combine" },
      ],
      helpText:
        "Append: all inputs' items are concatenated into one flat list. Combine: outputs a single item whose fields are keyed by each input's source node name, holding that source's full array of items.",
    },
  ],
  async execute({ parameters, input, inputs }) {
    if (parameters.mode !== "combine") {
      return { branches: { main: input } };
    }

    const groups: NodeExecuteInputGroup[] =
      inputs && inputs.length > 0 ? inputs : [{ sourceNodeName: "input", items: input }];
    const json: Record<string, unknown> = {};
    for (const group of groups) {
      json[group.sourceNodeName] = group.items.map((item) => item.json);
    }

    return { branches: { main: [{ json }] } };
  },
};
