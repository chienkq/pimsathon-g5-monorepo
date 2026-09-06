import type { WorkflowDefinition, WorkflowSummary } from "../types.js";

/**
 * Storage abstraction for workflows. Swap the implementation (e.g. for an HTTP-backed one talking
 * to a real backend) without touching any UI code — everything in `workflow-ui` depends on this
 * interface, not on a concrete implementation.
 */
export interface WorkflowRepository {
  list(): Promise<WorkflowSummary[]>;
  get(id: string): Promise<WorkflowDefinition | undefined>;
  create(name: string): Promise<WorkflowDefinition>;
  save(workflow: WorkflowDefinition): Promise<WorkflowDefinition>;
  remove(id: string): Promise<void>;
  duplicate(id: string): Promise<WorkflowDefinition>;
  setActive(id: string, active: boolean): Promise<WorkflowDefinition>;
}

export function createEmptyWorkflow(name: string): WorkflowDefinition {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    nodes: [
      {
        id: crypto.randomUUID(),
        type: "manualTrigger",
        name: "Manual Trigger",
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
    active: workflow.active,
    updatedAt: workflow.updatedAt,
    nodeCount: workflow.nodes.length,
  };
}
