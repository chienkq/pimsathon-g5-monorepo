import { createEmptyFilterValue, getFilterFieldValue } from "../filter.js";
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
    {
      key: "id",
      label: "Id",
      type: "string",
      default: "",
      showWhen: { key: "action", values: ["Get", "Update", "Move Status", "Delete"] },
    },
    {
      key: "moveStatus",
      label: "Status",
      type: "select",
      default: "",
      options: [{ label: "(any)", value: "" }, ...WORK_ITEM_STATUSES.map((value) => ({ label: value, value }))],
      helpText: "The target status for Move Status.",
      showWhen: { key: "action", values: ["Move Status"] },
    },
    {
      key: "filters",
      label: "Fields",
      type: "filter",
      default: createEmptyFilterValue(),
      filterFields: [
        { label: "Project Id", value: "projectId", type: "string", dynamicValueOptions: "projects" },
        {
          label: "Status",
          value: "status",
          type: "string",
          valueOptions: WORK_ITEM_STATUSES.map((value) => ({ label: value, value })),
        },
        {
          label: "Priority",
          value: "priority",
          type: "string",
          valueOptions: WORK_ITEM_PRIORITIES.map((value) => ({ label: value, value })),
        },
        { label: "External Provider", value: "externalProvider", type: "string" },
        { label: "External Key", value: "externalKey", type: "string" },
      ],
      helpText:
        'Pick a field, an operator, and a value (fixed text or an expression). For List, only "Equals" is applied as a filter — other operators are accepted but not evaluated, since the underlying store only supports exact-match lookups. For Create/Update, whatever value you set here is written as-is, regardless of operator.',
      showWhen: { key: "action", values: ["List", "Create", "Update"] },
    },
    {
      key: "title",
      label: "Title",
      type: "string",
      default: "",
      showWhen: { key: "action", values: ["Create", "Update"] },
    },
    {
      key: "description",
      label: "Description",
      type: "string",
      default: "",
      showWhen: { key: "action", values: ["Create", "Update"] },
    },
    {
      key: "assigneeId",
      label: "Assignee Id",
      type: "string",
      default: "",
      showWhen: { key: "action", values: ["Create", "Update"] },
    },
    {
      key: "labels",
      label: "Labels (comma-separated)",
      type: "string",
      default: "",
      showWhen: { key: "action", values: ["Create", "Update"] },
    },
    {
      key: "startDate",
      label: "Start Date",
      type: "string",
      default: "",
      showWhen: { key: "action", values: ["Create", "Update"] },
    },
    {
      key: "dueDate",
      label: "Due Date",
      type: "string",
      default: "",
      showWhen: { key: "action", values: ["Create", "Update"] },
    },
    {
      key: "cycleId",
      label: "Cycle Id",
      type: "string",
      default: "",
      showWhen: { key: "action", values: ["Create", "Update"] },
    },
    {
      key: "moduleIds",
      label: "Module Ids (comma-separated)",
      type: "string",
      default: "",
      showWhen: { key: "action", values: ["Create", "Update"] },
    },
    {
      key: "storyPoints",
      label: "Story Points",
      type: "number",
      default: "",
      helpText: "Estimate for burndown/velocity analysis.",
      showWhen: { key: "action", values: ["Create", "Update"] },
    },
    {
      key: "aiNote",
      label: "AI Note",
      type: "string",
      default: "",
      helpText: "Free-text scratchpad for AI/humans to leave context on this item.",
      showWhen: { key: "action", values: ["Create", "Update"] },
    },
  ],
  async execute({ parameters, services }) {
    const workItemStore = services?.workItemStore as WorkItemStoreService | undefined;
    if (!workItemStore)
      throw new Error("Work Item node requires a `workItemStore` service (only available in backend).");

    const action = String(parameters.action ?? "List");
    const toItem = (item: PlatformWorkItem): NodeExecutionData => ({ json: { ...item } });
    const filterField = (field: string) => getFilterFieldValue(parameters.filters, field);

    switch (action) {
      case "List": {
        const filter: WorkItemListFilter = {};
        const projectId = filterField("projectId");
        const status = filterField("status");
        const priority = filterField("priority");
        const externalProvider = filterField("externalProvider");
        const externalKey = filterField("externalKey");
        if (projectId) filter.projectId = projectId;
        if (status) filter.status = status as WorkItemStatus;
        if (priority) filter.priority = priority as WorkItemPriority;
        if (externalProvider) filter.externalProvider = externalProvider;
        if (externalKey) filter.externalKey = externalKey;
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
        const projectId = filterField("projectId") ?? "";
        const title = String(parameters.title ?? "");
        if (!projectId) throw new Error("Work Item Create requires a Project Id.");
        if (!title) throw new Error("Work Item Create requires a Title.");
        const created = await workItemStore.create({
          projectId,
          title,
          description: String(parameters.description ?? ""),
          status: (filterField("status") || "Todo") as WorkItemStatus,
          priority: (filterField("priority") || "Medium") as WorkItemPriority,
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
          externalProvider: filterField("externalProvider"),
          externalKey: filterField("externalKey"),
          aiNote: parameters.aiNote ? String(parameters.aiNote) : undefined,
        });
        return { branches: { main: [toItem(created)] } };
      }
      case "Update": {
        const id = String(parameters.id ?? "");
        if (!id) throw new Error("Work Item Update requires an Id.");
        const status = filterField("status");
        const priority = filterField("priority");
        const projectId = filterField("projectId");
        const externalProvider = filterField("externalProvider");
        const externalKey = filterField("externalKey");
        const patch: Partial<WorkItemInput> = {};
        if (parameters.title) patch.title = String(parameters.title);
        if (parameters.description) patch.description = String(parameters.description);
        if (status) patch.status = status as WorkItemStatus;
        if (priority) patch.priority = priority as WorkItemPriority;
        if (projectId) patch.projectId = projectId;
        if (parameters.assigneeId) patch.assigneeId = String(parameters.assigneeId);
        if (parameters.labels) patch.labels = parseCommaList(parameters.labels);
        if (parameters.startDate) patch.startDate = String(parameters.startDate);
        if (parameters.dueDate) patch.dueDate = String(parameters.dueDate);
        if (parameters.cycleId) patch.cycleId = String(parameters.cycleId);
        if (parameters.moduleIds) patch.moduleIds = parseCommaList(parameters.moduleIds);
        if (parameters.storyPoints !== undefined && parameters.storyPoints !== "")
          patch.storyPoints = Number(parameters.storyPoints);
        if (externalProvider) patch.externalProvider = externalProvider;
        if (externalKey) patch.externalKey = externalKey;
        if (parameters.aiNote) patch.aiNote = String(parameters.aiNote);
        const updated = await workItemStore.update(id, patch);
        return { branches: { main: [toItem(updated)] } };
      }
      case "Move Status": {
        const id = String(parameters.id ?? "");
        const status = parameters.moveStatus as WorkItemStatus;
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
