import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";

/**
 * Mirrors `apps/admin-ui/src/domain/types.ts`'s `STATUSES`/`PRIORITIES` exactly. There's no shared
 * types package between admin-ui and workflow-core (admin-ui is its own app, not a workspace
 * dependency of this one) — keep these two lists in sync by hand if admin-ui's ever change.
 */
export const WORK_ITEM_STATUSES = ["Todo", "In Progress", "In Review", "Done", "Cancelled"] as const;
export type WorkItemStatus = (typeof WORK_ITEM_STATUSES)[number];
export const WORK_ITEM_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export type WorkItemPriority = (typeof WORK_ITEM_PRIORITIES)[number];

/**
 * A work item IS the PM tool's own ticket — the equivalent of a Jira issue for a Jira-backed org —
 * not a copy normalized in from an external tracker. Field names deliberately match admin-ui's
 * `WorkItem` interface one-for-one.
 */
export interface PlatformWorkItem {
  id: string;
  projectId: string;
  /** Per-project sequence number — combine with `projectCode` for a Jira-style key ("PMS-103"). */
  number: number;
  projectCode: string;
  /** `${projectCode}-${number}`, precomputed so downstream nodes (e.g. Raise Alert) don't each reimplement it. */
  key: string;
  title: string;
  description: string;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  assigneeId: string;
  labels: string[];
  startDate: string;
  dueDate: string;
  cycleId: string;
  moduleIds: string[];
  /** Estimate used for burndown/velocity (Analyze Cycle) — unset for items authored directly, not synced from a tracker. */
  storyPoints?: number;
  /** Set only for work items auto-created/updated from an external tracker (e.g. Jira sync) — see workItems.externalProvider/externalKey in workflow-db's schema. Lets a workflow look up "is there already a work item for this Jira issue / GitHub PR" before deciding to Create vs Update. */
  externalProvider?: string;
  externalKey?: string;
  /** Free-text scratchpad AI/humans write to so future AI runs (e.g. a health-check workflow) can read a work item's context fast, without re-deriving it. */
  aiNote?: string;
}

export type WorkItemInput = Omit<PlatformWorkItem, "id" | "number" | "projectCode" | "key">;

export interface WorkItemListFilter {
  projectId?: string;
  status?: WorkItemStatus;
  priority?: WorkItemPriority;
  externalProvider?: string;
  externalKey?: string;
}

/** Injected via `executeWorkflow(workflow, { services: { workItemStore } })` — backend provides the real implementation. */
export interface WorkItemStoreService {
  list(filter: WorkItemListFilter): Promise<PlatformWorkItem[]>;
  get(id: string): Promise<PlatformWorkItem | undefined>;
  create(input: WorkItemInput): Promise<PlatformWorkItem>;
  update(id: string, patch: Partial<WorkItemInput>): Promise<PlatformWorkItem>;
  moveStatus(id: string, status: WorkItemStatus): Promise<PlatformWorkItem>;
  remove(id: string): Promise<void>;
}

const ACTIONS = ["List", "Get", "Create", "Update", "Move Status", "Delete"] as const;

function parseCommaList(value: unknown): string[] {
  return String(value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export const workItemNodeType: NodeTypeDefinition = {
  type: "workItem",
  displayName: "Work Item",
  description:
    "Reads or writes the PM tool's own work items (admin-ui's ticket equivalent) — list, get, create, update, move, delete.",
  group: "platform",
  color: "#3d5a80",
  hasInput: true,
  outputs: ["main"],
  parameters: [
    {
      key: "action",
      label: "Action",
      type: "select",
      default: "List",
      options: ACTIONS.map((value) => ({ label: value, value })),
    },
    { key: "id", label: "Id", type: "string", default: "", helpText: "Used by Get, Update, Move Status, Delete." },
    {
      key: "projectId",
      label: "Project Id",
      type: "string",
      default: "",
      helpText: "Used by List (filter) and Create.",
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      default: "",
      options: [{ label: "(any)", value: "" }, ...WORK_ITEM_STATUSES.map((value) => ({ label: value, value }))],
      helpText: "Used by List (filter), Create, Update, and as the target status for Move Status.",
    },
    {
      key: "priority",
      label: "Priority",
      type: "select",
      default: "",
      options: [{ label: "(any)", value: "" }, ...WORK_ITEM_PRIORITIES.map((value) => ({ label: value, value }))],
      helpText: "Used by List (filter), Create, Update.",
    },
    { key: "title", label: "Title", type: "string", default: "", helpText: "Used by Create, Update." },
    { key: "description", label: "Description", type: "string", default: "", helpText: "Used by Create, Update." },
    { key: "assigneeId", label: "Assignee Id", type: "string", default: "", helpText: "Used by Create, Update." },
    {
      key: "labels",
      label: "Labels (comma-separated)",
      type: "string",
      default: "",
      helpText: "Used by Create, Update.",
    },
    { key: "startDate", label: "Start Date", type: "string", default: "", helpText: "Used by Create, Update." },
    { key: "dueDate", label: "Due Date", type: "string", default: "", helpText: "Used by Create, Update." },
    { key: "cycleId", label: "Cycle Id", type: "string", default: "", helpText: "Used by Create, Update." },
    {
      key: "moduleIds",
      label: "Module Ids (comma-separated)",
      type: "string",
      default: "",
      helpText: "Used by Create, Update.",
    },
    {
      key: "storyPoints",
      label: "Story Points",
      type: "number",
      default: "",
      helpText: "Used by Create, Update. Estimate for burndown/velocity analysis.",
    },
    {
      key: "externalProvider",
      label: "External Provider",
      type: "string",
      default: "",
      helpText: 'Used by List (filter), Create, Update. e.g. "jira" — links this item back to its source issue/PR.',
    },
    {
      key: "externalKey",
      label: "External Key",
      type: "string",
      default: "",
      helpText: "Used by List (filter), Create, Update. e.g. a Jira issue key.",
    },
    {
      key: "aiNote",
      label: "AI Note",
      type: "string",
      default: "",
      helpText: "Used by Create, Update. Free-text scratchpad for AI/humans to leave context on this item.",
    },
  ],
  async execute({ parameters, services }) {
    const workItemStore = services?.workItemStore as WorkItemStoreService | undefined;
    if (!workItemStore)
      throw new Error("Work Item node requires a `workItemStore` service (only available in backend).");

    const action = String(parameters.action ?? "List");
    const toItem = (item: PlatformWorkItem): NodeExecutionData => ({ json: { ...item } });

    switch (action) {
      case "List": {
        const filter: WorkItemListFilter = {};
        if (parameters.projectId) filter.projectId = String(parameters.projectId);
        if (parameters.status) filter.status = parameters.status as WorkItemStatus;
        if (parameters.priority) filter.priority = parameters.priority as WorkItemPriority;
        if (parameters.externalProvider) filter.externalProvider = String(parameters.externalProvider);
        if (parameters.externalKey) filter.externalKey = String(parameters.externalKey);
        const items = await workItemStore.list(filter);
        return { branches: { main: items.map(toItem) } };
      }
      case "Get": {
        const id = String(parameters.id ?? "");
        if (!id) throw new Error("Work Item Get requires an Id.");
        const item = await workItemStore.get(id);
        return { branches: { main: item ? [toItem(item)] : [] } };
      }
      case "Create": {
        const projectId = String(parameters.projectId ?? "");
        const title = String(parameters.title ?? "");
        if (!projectId) throw new Error("Work Item Create requires a Project Id.");
        if (!title) throw new Error("Work Item Create requires a Title.");
        const created = await workItemStore.create({
          projectId,
          title,
          description: String(parameters.description ?? ""),
          status: (parameters.status || "Todo") as WorkItemStatus,
          priority: (parameters.priority || "Medium") as WorkItemPriority,
          assigneeId: String(parameters.assigneeId ?? ""),
          labels: parseCommaList(parameters.labels),
          startDate: String(parameters.startDate ?? ""),
          dueDate: String(parameters.dueDate ?? ""),
          cycleId: String(parameters.cycleId ?? ""),
          moduleIds: parseCommaList(parameters.moduleIds),
          storyPoints:
            parameters.storyPoints === "" || parameters.storyPoints === undefined
              ? undefined
              : Number(parameters.storyPoints),
          externalProvider: parameters.externalProvider ? String(parameters.externalProvider) : undefined,
          externalKey: parameters.externalKey ? String(parameters.externalKey) : undefined,
          aiNote: parameters.aiNote ? String(parameters.aiNote) : undefined,
        });
        return { branches: { main: [toItem(created)] } };
      }
      case "Update": {
        const id = String(parameters.id ?? "");
        if (!id) throw new Error("Work Item Update requires an Id.");
        const patch: Partial<WorkItemInput> = {};
        if (parameters.title) patch.title = String(parameters.title);
        if (parameters.description) patch.description = String(parameters.description);
        if (parameters.status) patch.status = parameters.status as WorkItemStatus;
        if (parameters.priority) patch.priority = parameters.priority as WorkItemPriority;
        if (parameters.assigneeId) patch.assigneeId = String(parameters.assigneeId);
        if (parameters.labels) patch.labels = parseCommaList(parameters.labels);
        if (parameters.startDate) patch.startDate = String(parameters.startDate);
        if (parameters.dueDate) patch.dueDate = String(parameters.dueDate);
        if (parameters.cycleId) patch.cycleId = String(parameters.cycleId);
        if (parameters.moduleIds) patch.moduleIds = parseCommaList(parameters.moduleIds);
        if (parameters.storyPoints !== undefined && parameters.storyPoints !== "")
          patch.storyPoints = Number(parameters.storyPoints);
        if (parameters.externalProvider) patch.externalProvider = String(parameters.externalProvider);
        if (parameters.externalKey) patch.externalKey = String(parameters.externalKey);
        if (parameters.aiNote) patch.aiNote = String(parameters.aiNote);
        const updated = await workItemStore.update(id, patch);
        return { branches: { main: [toItem(updated)] } };
      }
      case "Move Status": {
        const id = String(parameters.id ?? "");
        const status = parameters.status as WorkItemStatus;
        if (!id || !status) throw new Error("Work Item Move Status requires an Id and a Status.");
        const updated = await workItemStore.moveStatus(id, status);
        return { branches: { main: [toItem(updated)] } };
      }
      case "Delete": {
        const id = String(parameters.id ?? "");
        if (!id) throw new Error("Work Item Delete requires an Id.");
        await workItemStore.remove(id);
        return { branches: { main: [] } };
      }
      default:
        throw new Error(`Work Item: unknown action "${action}".`);
    }
  },
};
