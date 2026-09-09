import type { FactStoreService, WorkItemFactFilter } from "./factUpsert.js";
import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";
import { parseJsonParameter } from "../utils.js";

export const factQueryNodeType: NodeTypeDefinition = {
  type: "factQuery",
  displayName: "Fact Store — Query",
  description: "Reads work-item facts back out of the fact store, filtered by equality on a few fields.",
  group: "data",
  color: "#7d726d",
  hasInput: false,
  outputs: ["main"],
  parameters: [
    {
      key: "filter",
      label: "Filter (JSON)",
      type: "json",
      default: "{}",
      helpText:
        'Equality filter, e.g. {"priority":"Urgent"}. Supported keys: provider, projectKey, status, priority, assignee.',
    },
  ],
  async execute({ parameters, services }) {
    const factStore = services?.factStore as FactStoreService | undefined;
    if (!factStore) throw new Error("Fact Store — Query requires a `factStore` service (only available in backend).");

    const filter = parseJsonParameter<WorkItemFactFilter>(parameters.filter, {});
    const facts = await factStore.queryWorkItems(filter);
    const output: NodeExecutionData[] = facts.map((fact) => ({ json: { ...fact } }));
    return { branches: { main: output } };
  },
};
