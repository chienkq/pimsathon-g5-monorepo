import type { NodeExecuteInputGroup, NodeExecutionData, NodeTypeDefinition } from "../types.js";

const DEFAULT_CODE = "// `items` is the array of input items, each shaped as { json }.\nreturn items;";

export const codeNodeType: NodeTypeDefinition = {
  type: "code",
  displayName: "Code",
  description: "Runs custom JavaScript against the input items.",
  group: "core",
  color: "#5a189a",
  hasInput: true,
  outputs: ["main"],
  parameters: [
    {
      key: "code",
      label: "JavaScript",
      type: "code",
      default: DEFAULT_CODE,
      helpText:
        "Return an array of items (or plain objects, auto-wrapped as { json }). When this node has multiple incoming connections, `inputs` (an array of { sourceNodeName, items }) is also available, so you can tell items from each upstream node apart instead of only seeing them flattened into `items`.",
      required: true,
    },
  ],
  async execute({ parameters, input, inputs }) {
    const code = String(parameters.code ?? DEFAULT_CODE);
    const groups: NodeExecuteInputGroup[] =
      inputs && inputs.length > 0 ? inputs : [{ sourceNodeName: "input", items: input }];
    // Runs entirely client-side, in the same trust boundary as the user's own browser devtools
    // console — there is no multi-tenant or server-side execution boundary to protect here.
    const runUserCode = new Function("items", "inputs", `"use strict";\n${code}`);
    const result: unknown = runUserCode(input, groups);
    const resultItems = Array.isArray(result) ? result : [result];
    const output: NodeExecutionData[] = resultItems.map((entry) =>
      entry && typeof entry === "object" && "json" in entry
        ? (entry as NodeExecutionData)
        : { json: entry as Record<string, unknown> }
    );
    return { branches: { main: output } };
  },
};
