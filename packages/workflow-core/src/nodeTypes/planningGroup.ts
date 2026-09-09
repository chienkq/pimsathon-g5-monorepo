import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";

/** "cycle" ≈ a sprint, "module" ≈ W10's milestone — see workflow-db schema.ts's `planningGroups` comment. */
export type PlanningGroupKind = "cycle" | "module";

/** Mirrors admin-ui's `PlanningGroup` — cycles and modules share this one shape there too. */
export interface PlatformPlanningGroup {
  id: string;
  projectId: string;
  kind: PlanningGroupKind;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  leadId: string;
}

export type PlanningGroupInput = Omit<PlatformPlanningGroup, "id">;

export interface PlanningGroupListFilter {
  projectId?: string;
  kind?: PlanningGroupKind;
}

/** Injected via `executeWorkflow(workflow, { services: { planningGroupStore } })` — backend provides the real implementation. */
export interface PlanningGroupStoreService {
  list(filter: PlanningGroupListFilter): Promise<PlatformPlanningGroup[]>;
  get(id: string): Promise<PlatformPlanningGroup | undefined>;
  create(input: PlanningGroupInput): Promise<PlatformPlanningGroup>;
  update(id: string, patch: Partial<PlanningGroupInput>): Promise<PlatformPlanningGroup>;
  remove(id: string): Promise<void>;
}

const ACTIONS = ["List", "Get", "Create", "Update", "Delete"] as const;

export const planningGroupNodeType: NodeTypeDefinition = {
  type: "planningGroup",
  displayName: "Planning Group",
  description:
    "Reads or writes the PM tool's own cycles (sprints) and modules (milestones) — list, get, create, update, delete.",
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
    { key: "id", label: "Id", type: "string", default: "", helpText: "Used by Get, Update, Delete." },
    {
      key: "projectId",
      label: "Project Id",
      type: "string",
      default: "",
      helpText: "Used by List (filter) and Create.",
    },
    {
      key: "kind",
      label: "Kind",
      type: "select",
      default: "module",
      options: [
        { label: "(any, List only)", value: "" },
        { label: "Cycle (sprint)", value: "cycle" },
        { label: "Module (milestone)", value: "module" },
      ],
      helpText: "Used by List (filter) and Create.",
    },
    { key: "name", label: "Name", type: "string", default: "", helpText: "Used by Create, Update." },
    { key: "description", label: "Description", type: "string", default: "", helpText: "Used by Create, Update." },
    { key: "startDate", label: "Start Date", type: "string", default: "", helpText: "Used by Create, Update." },
    { key: "endDate", label: "End Date", type: "string", default: "", helpText: "Used by Create, Update." },
    { key: "leadId", label: "Lead Id", type: "string", default: "", helpText: "Used by Create, Update." },
  ],
  async execute({ parameters, services }) {
    const planningGroupStore = services?.planningGroupStore as PlanningGroupStoreService | undefined;
    if (!planningGroupStore) {
      throw new Error("Planning Group node requires a `planningGroupStore` service (only available in backend).");
    }

    const action = String(parameters.action ?? "List");
    const toItem = (group: PlatformPlanningGroup): NodeExecutionData => ({ json: { ...group } });

    switch (action) {
      case "List": {
        const filter: PlanningGroupListFilter = {};
        if (parameters.projectId) filter.projectId = String(parameters.projectId);
        if (parameters.kind) filter.kind = parameters.kind as PlanningGroupKind;
        const groups = await planningGroupStore.list(filter);
        return { branches: { main: groups.map(toItem) } };
      }
      case "Get": {
        const id = String(parameters.id ?? "");
        if (!id) throw new Error("Planning Group Get requires an Id.");
        const group = await planningGroupStore.get(id);
        return { branches: { main: group ? [toItem(group)] : [] } };
      }
      case "Create": {
        const projectId = String(parameters.projectId ?? "");
        const name = String(parameters.name ?? "");
        const kind = (parameters.kind || "module") as PlanningGroupKind;
        if (!projectId) throw new Error("Planning Group Create requires a Project Id.");
        if (!name) throw new Error("Planning Group Create requires a Name.");
        const created = await planningGroupStore.create({
          projectId,
          kind,
          name,
          description: String(parameters.description ?? ""),
          startDate: String(parameters.startDate ?? ""),
          endDate: String(parameters.endDate ?? ""),
          leadId: String(parameters.leadId ?? ""),
        });
        return { branches: { main: [toItem(created)] } };
      }
      case "Update": {
        const id = String(parameters.id ?? "");
        if (!id) throw new Error("Planning Group Update requires an Id.");
        const patch: Partial<PlanningGroupInput> = {};
        if (parameters.name) patch.name = String(parameters.name);
        if (parameters.description) patch.description = String(parameters.description);
        if (parameters.startDate) patch.startDate = String(parameters.startDate);
        if (parameters.endDate) patch.endDate = String(parameters.endDate);
        if (parameters.leadId) patch.leadId = String(parameters.leadId);
        const updated = await planningGroupStore.update(id, patch);
        return { branches: { main: [toItem(updated)] } };
      }
      case "Delete": {
        const id = String(parameters.id ?? "");
        if (!id) throw new Error("Planning Group Delete requires an Id.");
        await planningGroupStore.remove(id);
        return { branches: { main: [] } };
      }
      default:
        throw new Error(`Planning Group: unknown action "${action}".`);
    }
  },
};
