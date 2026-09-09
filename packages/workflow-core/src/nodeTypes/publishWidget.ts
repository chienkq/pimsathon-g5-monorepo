import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";

export type WidgetType = "bar" | "line" | "pie" | "table";

export interface NormalizedWidget {
  widgetId: string;
  title: string;
  type: WidgetType;
  series: Record<string, unknown>[];
}

/** Injected via `executeWorkflow(workflow, { services: { widgetStore } })` — backend provides the real implementation. */
export interface WidgetStoreService {
  publish(widget: NormalizedWidget): Promise<void>;
}

/**
 * The Project Health Dashboard's terminal node — writes chart-ready data, not a live workflow
 * output. The dashboard reads `widgets` directly, so a chart keeps showing the last-computed value
 * even between workflow runs (see workflow-db schema.ts's comment on the `widgets` table).
 */
export const publishWidgetNodeType: NodeTypeDefinition = {
  type: "publishWidget",
  displayName: "Publish Widget",
  description: "Writes the input items as a dashboard widget's chart data.",
  group: "data",
  color: "#7d726d",
  hasInput: true,
  outputs: ["main"],
  parameters: [
    {
      key: "widgetId",
      label: "Widget Id",
      type: "string",
      default: "",
      placeholder: "e.g. team-workload",
      required: true,
    },
    { key: "title", label: "Title", type: "string", default: "" },
    {
      key: "type",
      label: "Chart Type",
      type: "select",
      default: "bar",
      options: ["bar", "line", "pie", "table"].map((value) => ({ label: value, value })),
    },
  ],
  async execute({ parameters, input, services }) {
    const widgetId = String(parameters.widgetId ?? "");
    if (!widgetId) throw new Error("Publish Widget node requires a Widget Id.");
    const title = String(parameters.title ?? widgetId);
    const type = String(parameters.type ?? "bar") as WidgetType;

    const widgetStore = services?.widgetStore as WidgetStoreService | undefined;
    if (!widgetStore) throw new Error("Publish Widget requires a `widgetStore` service (only available in backend).");

    const series = input.map((item) => ({ ...item.json }));
    await widgetStore.publish({ widgetId, title, type, series });

    const output: NodeExecutionData[] = input;
    return { branches: { main: output } };
  },
};
