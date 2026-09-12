import type { WorkflowDefinition, WorkflowNodeDefinition, WorkflowSummary } from "../types.js";

/**
 * Storage abstraction for workflows. Swap the implementation (e.g. for an HTTP-backed one talking
 * to a real backend) without touching any UI code — everything in `workflow-ui` depends on this
 * interface, not on a concrete implementation.
 */
export interface WorkflowRepository {
  list(): Promise<WorkflowSummary[]>;
  get(id: string): Promise<WorkflowDefinition | undefined>;
  /** `initialNodes`, when given, replaces the default single-`webhook`-node starting graph (e.g. seeding a new workflow with a `workItem` node from the WorkItem detail panel's "Create workflow" shortcut). */
  create(name: string, initialNodes?: WorkflowNodeDefinition[]): Promise<WorkflowDefinition>;
  save(workflow: WorkflowDefinition): Promise<WorkflowDefinition>;
  remove(id: string): Promise<void>;
  duplicate(id: string): Promise<WorkflowDefinition>;
  setActive(id: string, active: boolean): Promise<WorkflowDefinition>;
}

export function createEmptyWorkflow(name: string, initialNodes?: WorkflowNodeDefinition[]): WorkflowDefinition {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    nodes: initialNodes ?? [
      {
        id: crypto.randomUUID(),
        type: "webhook",
        name: "Webhook",
        position: { x: 100, y: 150 },
        parameters: {},
      },
    ],
    connections: [],
    active: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function toWorkflowSummary(workflow: WorkflowDefinition): WorkflowSummary {
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    active: workflow.active,
    updatedAt: workflow.updatedAt,
    nodeCount: workflow.nodes.length,
    isSystem: workflow.isSystem,
  };
}
