import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";
import { getByPath, parseJsonParameter } from "../utils.js";

/**
 * Simplified vs. n8n's real Switch (which has a fully dynamic number of outputs): outputs are
 * fixed at 3 rule slots + fallback, since the canvas renders handles from the static
 * `nodeType.outputs` list rather than per-instance parameters.
 */
export const switchNodeType: NodeTypeDefinition = {
  type: "switch",
  displayName: "Switch",
  description: "Routes each item to one of up to 3 outputs based on matching a field value, or to fallback.",
  group: "flow",
  color: "#ae2012",
  hasInput: true,
  outputs: ["0", "1", "2", "fallback"],
  parameters: [
    {
      key: "field",
      label: "Field (dot path)",
      type: "string",
      default: "",
      placeholder: "data.status",
      required: true,
    },
    {
      key: "rules",
      label: "Values (JSON array, up to 3)",
      type: "json",
      default: '["value1", "value2", "value3"]',
      helpText: 'Matched in order to outputs "0"/"1"/"2". Anything else goes to "fallback".',
    },
  ],
  async execute({ parameters, input }) {
    const field = String(parameters.field ?? "");
    const rules = parseJsonParameter<unknown[]>(parameters.rules, []).slice(0, 3).map(String);

    const branches: Record<string, NodeExecutionData[]> = { "0": [], "1": [], "2": [], fallback: [] };
    for (const item of input) {
      const actual = String(getByPath(item.json, field));
      const index = rules.indexOf(actual);
      branches[index === -1 ? "fallback" : String(index)].push(item);
    }
    return { branches };
  },
};
