import type { NodeTypeDefinition } from "../types.js";

/** Clamped so a misconfigured Wait node can't hang the UI or a test run. */
const MAX_WAIT_MS = 10_000;

export const waitNodeType: NodeTypeDefinition = {
  type: "wait",
  displayName: "Wait",
  description: "Pauses before passing items through unchanged.",
  group: "flow",
  color: "#6c757d",
  hasInput: true,
  outputs: ["main"],
  parameters: [
    { key: "amount", label: "Amount", type: "number", default: 1 },
    {
      key: "unit",
      label: "Unit",
      type: "select",
      default: "seconds",
      options: [
        { label: "Seconds", value: "seconds" },
        { label: "Minutes", value: "minutes" },
      ],
    },
  ],
  async execute({ parameters, input }) {
    const amount = Math.max(0, Number(parameters.amount) || 0);
    const unit = String(parameters.unit ?? "seconds");
    const ms = Math.min(MAX_WAIT_MS, amount * (unit === "minutes" ? 60_000 : 1_000));
    await new Promise((resolve) => setTimeout(resolve, ms));
    return { branches: { main: input } };
  },
};
