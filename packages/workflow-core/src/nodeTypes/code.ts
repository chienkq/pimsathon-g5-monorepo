import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";

const DEFAULT_CODE = "// `items` is the array of input items, each shaped as { json }.\nreturn items;";

export const codeNodeType: NodeTypeDefinition = {
  type: "code",
  displayName: "Code",
  description: "Runs custom JavaScript against the input items.",
  group: "action",
  color: "#5a189a",
  hasInput: true,
  outputs: ["main"],
  parameters: [
    {
      key: "code",
      label: "JavaScript",
      type: "code",
      default: DEFAULT_CODE,
      helpText: "Return an array of items (or plain objects, auto-wrapped as { json }).",
    },
  ],
  async execute({ parameters, input }) {
    const code = String(parameters.code ?? DEFAULT_CODE);
    // Runs entirely client-side, in the same trust boundary as the user's own browser devtools
    // console — there is no multi-tenant or server-side execution boundary to protect here.
    const runUserCode = new Function("items", `"use strict";\n${code}`);
    const result: unknown = runUserCode(input);
    const resultItems = Array.isArray(result) ? result : [result];
    const output: NodeExecutionData[] = resultItems.map((entry) =>
      entry && typeof entry === "object" && "json" in entry
        ? (entry as NodeExecutionData)
        : { json: entry as Record<string, unknown> }
    );
    return { branches: { main: output } };
  },
};
