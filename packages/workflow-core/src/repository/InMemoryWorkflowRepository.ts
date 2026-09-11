import type { WorkflowDefinition, WorkflowSummary } from "../types.js";
import { createEmptyWorkflow, toWorkflowSummary, type WorkflowRepository } from "./WorkflowRepository.js";

/** Plain in-memory store. Used as a safe default outside the browser (tests, SSR) and for unit tests. */
export class InMemoryWorkflowRepository implements WorkflowRepository {
  private workflows = new Map<string, WorkflowDefinition>();

  async list(): Promise<WorkflowSummary[]> {
    return [...this.workflows.values()]
      .map(toWorkflowSummary)
      .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: string): Promise<WorkflowDefinition | undefined> {
    return this.workflows.get(id);
  }

  async create(name: string): Promise<WorkflowDefinition> {
    const workflow = createEmptyWorkflow(name);
    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  async save(workflow: WorkflowDefinition): Promise<WorkflowDefinition> {
    const updated: WorkflowDefinition = { ...workflow, updatedAt: new Date().toISOString() };
    this.workflows.set(updated.id, updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const workflow = this.workflows.get(id);
    if (workflow?.isSystem) throw new Error(`Workflow ${id} is a system workflow and cannot be deleted`);
    this.workflows.delete(id);
  }

  async duplicate(id: string): Promise<WorkflowDefinition> {
    const source = this.workflows.get(id);
    if (!source) throw new Error(`Workflow ${id} not found`);
    const now = new Date().toISOString();
    const copy: WorkflowDefinition = {
      ...source,
      id: crypto.randomUUID(),
      name: `${source.name} (copy)`,
      active: false,
      isSystem: false,
      createdAt: now,
      updatedAt: now,
    };
    this.workflows.set(copy.id, copy);
    return copy;
  }

  async setActive(id: string, active: boolean): Promise<WorkflowDefinition> {
    const workflow = this.workflows.get(id);
    if (!workflow) throw new Error(`Workflow ${id} not found`);
    const updated: WorkflowDefinition = { ...workflow, active, updatedAt: new Date().toISOString() };
    this.workflows.set(id, updated);
    return updated;
  }
}
