import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";

/**
 * Counts input items grouped by one field's value — enough for a bar/pie chart over "current state"
 * (workload by assignee, bugs by priority). Deliberately just count-by-group for now; sum/avg/median
 * (the fuller blueprint spec) are follow-up work once a second chart actually needs them.
 */
export const aggregateNodeType: NodeTypeDefinition = {
  type: "aggregate",
  displayName: "Aggregate",
  description: "Groups input items by one field, counting them per group (and optionally summing a numeric field too).",
  group: "data",
  color: "#7d726d",
  hasInput: true,
  outputs: ["main"],
  parameters: [
    {
      key: "groupByField",
      label: "Group By Field",
      type: "string",
      default: "",
      placeholder: "e.g. assigneeId",
      required: true,
    },
    { key: "emptyGroupLabel", label: "Label For Empty Value", type: "string", default: "(unassigned)" },
    {
      key: "sumField",
      label: "Sum Field (optional)",
      type: "string",
      default: "",
      placeholder: "e.g. storyPoints",
      helpText:
        "If set, also sums this numeric field per group (e.g. story points for a burndown) — non-numeric/missing values count as 0.",
    },
  ],
  async execute({ parameters, input }) {
    const groupByField = String(parameters.groupByField ?? "");
    if (!groupByField) throw new Error("Aggregate node requires a Group By Field.");
    const emptyGroupLabel = String(parameters.emptyGroupLabel ?? "(unassigned)");
    const sumField = String(parameters.sumField ?? "");

    const counts = new Map<string, number>();
    const sums = new Map<string, number>();
    for (const item of input) {
      const raw = item.json[groupByField];
      const key = raw === undefined || raw === null || raw === "" ? emptyGroupLabel : String(raw);
      counts.set(key, (counts.get(key) ?? 0) + 1);
      if (sumField) {
        const rawSum = item.json[sumField];
        const numeric = typeof rawSum === "number" ? rawSum : Number(rawSum);
        sums.set(key, (sums.get(key) ?? 0) + (Number.isFinite(numeric) ? numeric : 0));
      }
    }

    const output: NodeExecutionData[] = [...counts.entries()].map(([group, count]) => ({
      json: sumField ? { group, count, sum: sums.get(group) ?? 0 } : { group, count },
    }));
    return { branches: { main: output } };
  },
};
