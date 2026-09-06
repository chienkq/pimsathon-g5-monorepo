import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";
import { parseJsonParameter } from "../utils.js";

export const setFieldsNodeType: NodeTypeDefinition = {
  type: "setFields",
  displayName: "Set Fields",
  description: "Adds or overwrites fields on each item.",
  group: "action",
  color: "#0a9396",
  hasInput: true,
  outputs: ["main"],
  parameters: [
    {
      key: "fields",
      label: "Fields to Set (JSON)",
      type: "json",
      default: '{\n  "example": "value"\n}',
      helpText: "An object merged onto each item's data.",
    },
  ],
  async execute({ parameters, input }) {
    const fields = parseJsonParameter<Record<string, unknown>>(parameters.fields, {});
    const items = input.length > 0 ? input : [{ json: {} }];
    const output: NodeExecutionData[] = items.map((item) => ({ json: { ...item.json, ...fields } }));
    return { branches: { main: output } };
  },
};
