import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export interface NormalizedAlert {
  dedupeKey: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;
}

/** Injected via `executeWorkflow(workflow, { services: { alertStore } })` — backend provides the real implementation. */
export interface AlertStoreService {
  upsertAlert(alert: NormalizedAlert): Promise<void>;
}

/** Replaces `{{key}}` with `String(json[key])`, flat fields only — a placeholder for the real expression editor (gap tracker item 12). */
function renderTemplate(template: string, json: Record<string, unknown>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => String(json[key] ?? ""));
}

export const raiseAlertNodeType: NodeTypeDefinition = {
  type: "raiseAlert",
  displayName: "Raise Alert",
  description: "Upserts one alert per input item, deduped so a still-true condition doesn't spam new rows.",
  group: "data",
  color: "#a4620a",
  hasInput: true,
  outputs: ["main"],
  parameters: [
    {
      key: "alertType",
      label: "Alert Type",
      type: "string",
      default: "",
      placeholder: "e.g. stale-urgent-item",
      helpText: "Used as the dedupe-key prefix and as the alert's `source`.",
      required: true,
    },
    { key: "titleTemplate", label: "Title Template", type: "string", default: "{{alertTitle}}" },
    { key: "dedupeKeyField", label: "Dedupe Key Field", type: "string", default: "externalKey" },
    { key: "severityField", label: "Severity Field (on item)", type: "string", default: "severity" },
    {
      key: "defaultSeverity",
      label: "Default Severity",
      type: "select",
      default: "medium",
      options: ["low", "medium", "high", "critical"].map((value) => ({ label: value, value })),
      helpText: "Used when the item has no value at Severity Field.",
    },
  ],
  async execute({ parameters, input, services }) {
    const alertType = String(parameters.alertType ?? "");
    if (!alertType) throw new Error("Raise Alert node requires an Alert Type.");
    const titleTemplate = String(parameters.titleTemplate ?? "{{alertTitle}}");
    const dedupeKeyField = String(parameters.dedupeKeyField ?? "externalKey");
    const severityField = String(parameters.severityField ?? "severity");
    const defaultSeverity = String(parameters.defaultSeverity ?? "medium") as AlertSeverity;

    const alertStore = services?.alertStore as AlertStoreService | undefined;
    if (!alertStore) throw new Error("Raise Alert requires an `alertStore` service (only available in backend).");

    await Promise.all(
      input.map((item) => {
        const dedupeKeyValue = String(item.json[dedupeKeyField] ?? "");
        const severity = (item.json[severityField] as AlertSeverity | undefined) ?? defaultSeverity;
        const title = renderTemplate(titleTemplate, item.json);
        return alertStore.upsertAlert({
          dedupeKey: `${alertType}:${dedupeKeyValue}`,
          severity,
          title,
          message: title,
          source: alertType,
        });
      })
    );

    const output: NodeExecutionData[] = input;
    return { branches: { main: output } };
  },
};
