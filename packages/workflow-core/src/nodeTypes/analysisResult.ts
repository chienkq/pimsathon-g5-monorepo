import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";

/**
 * `ticketUpsert`/`ticketQuery` are hard-coded to the Jira-issue-shaped `NormalizedTicket` schema
 * (title/status/priority/assignee) — they can't store the health-check result an Analyze Cycle/
 * Module workflow produces (healthScore/risks/recommendedActions/...). Rather than overload that
 * schema (and risk breaking Jira Sync / Alert Engine, which depend on its exact shape), this is a
 * separate, deliberately generic pair of nodes for that one different shape of record.
 */
export type AnalysisSubjectType = "cycle" | "module" | "workItem";
export type AnalysisStatus = "on_track" | "at_risk" | "off_track";
export type AnalysisAlertSeverity = "low" | "medium" | "high" | "critical";

export interface AnalysisRisk {
  title: string;
  detail?: string;
  relatedWorkItemIds?: string[];
}

/** Matches the output schema `pm-workitem-workflows.md`'s Analyze Cycle/Analyze Module define. */
export interface AnalysisResult {
  subjectType: AnalysisSubjectType;
  subjectId: string;
  status: AnalysisStatus;
  healthScore: number;
  summary: string;
  risks: AnalysisRisk[];
  /** Cycle uses a hard deadline-driven `predictedCompletionDate`; Module has no fixed time-box so uses a velocity-trend `estimatedCompletionDate` instead — both land in this one field. */
  completionDate?: string;
  recommendedActions: string[];
  needsAlert: boolean;
  alertSeverity?: AnalysisAlertSeverity;
}

export interface StoredAnalysisResult extends AnalysisResult {
  id: string;
  analyzedAt: string;
}

/** Injected via `executeWorkflow(workflow, { services: { analysisResultStore } })` — backend provides the real implementation. */
export interface AnalysisResultStoreService {
  insert(result: AnalysisResult): Promise<StoredAnalysisResult>;
  queryLatest(subjectType: AnalysisSubjectType, subjectId: string, limit: number): Promise<StoredAnalysisResult[]>;
}

function toResult(json: Record<string, unknown>, subjectType: AnalysisSubjectType): AnalysisResult {
  const subjectId = String(json.subjectId ?? "");
  if (!subjectId) throw new Error("Analysis Result — Save requires a `subjectId` on each input item.");
  return {
    subjectType,
    subjectId,
    status: (json.status as AnalysisStatus) ?? "at_risk",
    healthScore: Number(json.healthScore ?? 0),
    summary: String(json.summary ?? ""),
    risks: Array.isArray(json.risks) ? (json.risks as AnalysisRisk[]) : [],
    completionDate: json.completionDate ? String(json.completionDate) : undefined,
    recommendedActions: Array.isArray(json.recommendedActions) ? (json.recommendedActions as string[]) : [],
    needsAlert: Boolean(json.needsAlert),
    alertSeverity: json.alertSeverity as AnalysisAlertSeverity | undefined,
  };
}

export const analysisResultSaveNodeType: NodeTypeDefinition = {
  type: "analysisResultSave",
  displayName: "Analysis Result — Save",
  description:
    "Stores one Cycle/Module health-check result per input item (status, health score, risks, recommended actions).",
  group: "data",
  color: "#7d726d",
  hasInput: true,
  outputs: ["main"],
  parameters: [
    {
      key: "subjectType",
      label: "Subject Type",
      type: "select",
      default: "cycle",
      options: [
        { label: "Cycle", value: "cycle" },
        { label: "Module", value: "module" },
        { label: "Work Item", value: "workItem" },
      ],
    },
  ],
  async execute({ parameters, input, services }) {
    const subjectType = (parameters.subjectType || "cycle") as AnalysisSubjectType;
    const analysisResultStore = services?.analysisResultStore as AnalysisResultStoreService | undefined;
    if (!analysisResultStore)
      throw new Error("Analysis Result — Save requires an `analysisResultStore` service (only available in backend).");

    const stored = await Promise.all(input.map((item) => analysisResultStore.insert(toResult(item.json, subjectType))));
    const output: NodeExecutionData[] = stored.map((result) => ({ json: { ...result } }));
    return { branches: { main: output } };
  },
};

export const analysisResultQueryNodeType: NodeTypeDefinition = {
  type: "analysisResultQuery",
  displayName: "Analysis Result — Query",
  description: "Reads back the most recent Cycle/Module health-check results for one subject, for trend comparison.",
  group: "data",
  color: "#7d726d",
  hasInput: true,
  outputs: ["main"],
  parameters: [
    {
      key: "subjectType",
      label: "Subject Type",
      type: "select",
      default: "cycle",
      options: [
        { label: "Cycle", value: "cycle" },
        { label: "Module", value: "module" },
        { label: "Work Item", value: "workItem" },
      ],
    },
    {
      key: "subjectIdField",
      label: "Subject Id Field (on input item)",
      type: "string",
      default: "id",
      helpText: "Reads the subject id off each input item (e.g. a Planning Group's `id`) rather than a fixed value.",
    },
    { key: "limit", label: "Limit", type: "number", default: 5 },
  ],
  async execute({ parameters, input, services }) {
    const subjectType = (parameters.subjectType || "cycle") as AnalysisSubjectType;
    const subjectIdField = String(parameters.subjectIdField ?? "id");
    const limit = Number(parameters.limit ?? 5);
    const analysisResultStore = services?.analysisResultStore as AnalysisResultStoreService | undefined;
    if (!analysisResultStore)
      throw new Error("Analysis Result — Query requires an `analysisResultStore` service (only available in backend).");

    const items = input.length > 0 ? input : [{ json: {} }];
    const output: NodeExecutionData[] = [];
    for (const item of items) {
      const subjectId = String(item.json[subjectIdField] ?? "");
      if (!subjectId) continue;
      const history = await analysisResultStore.queryLatest(subjectType, subjectId, limit);
      output.push({ json: { subjectId, history } });
    }
    return { branches: { main: output } };
  },
};
