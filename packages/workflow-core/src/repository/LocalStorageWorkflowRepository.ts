import type { WorkflowDefinition, WorkflowNodeDefinition, WorkflowSummary } from "../types.js";
import { createEmptyWorkflow, toWorkflowSummary, type WorkflowRepository } from "./WorkflowRepository.js";

const STORAGE_KEY = "pimsathon.workflows.v1";

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** Persists workflows to `localStorage`. Falls back to an in-memory map outside the browser (SSR). */
export class LocalStorageWorkflowRepository implements WorkflowRepository {
  private fallback = new Map<string, WorkflowDefinition>();

  private readAll(): Map<string, WorkflowDefinition> {
    if (!hasLocalStorage()) return this.fallback;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as WorkflowDefinition[]) : [];
      return new Map(parsed.map((workflow) => [workflow.id, workflow]));
    } catch {
      return new Map();
    }
  }

  private writeAll(workflows: Map<string, WorkflowDefinition>): void {
    if (!hasLocalStorage()) {
      this.fallback = workflows;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...workflows.values()]));
  }

  async list(): Promise<WorkflowSummary[]> {
    return [...this.readAll().values()]
      .map(toWorkflowSummary)
      .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: string): Promise<WorkflowDefinition | undefined> {
    return this.readAll().get(id);
  }

  async create(name: string, initialNodes?: WorkflowNodeDefinition[]): Promise<WorkflowDefinition> {
    const workflows = this.readAll();
    const workflow = createEmptyWorkflow(name, initialNodes);
    workflows.set(workflow.id, workflow);
    this.writeAll(workflows);
    return workflow;
  }

  async save(workflow: WorkflowDefinition): Promise<WorkflowDefinition> {
    const workflows = this.readAll();
    const updated: WorkflowDefinition = { ...workflow, updatedAt: new Date().toISOString() };
    workflows.set(updated.id, updated);
    this.writeAll(workflows);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const workflows = this.readAll();
    workflows.delete(id);
    this.writeAll(workflows);
  }

  async duplicate(id: string): Promise<WorkflowDefinition> {
    const workflows = this.readAll();
    const source = workflows.get(id);
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
    workflows.set(copy.id, copy);
    this.writeAll(workflows);
    return copy;
  }

  async setActive(id: string, active: boolean): Promise<WorkflowDefinition> {
    const workflows = this.readAll();
    const workflow = workflows.get(id);
    if (!workflow) throw new Error(`Workflow ${id} not found`);
    const updated: WorkflowDefinition = { ...workflow, active, updatedAt: new Date().toISOString() };
    workflows.set(id, updated);
    this.writeAll(workflows);
    return updated;
  }
}
