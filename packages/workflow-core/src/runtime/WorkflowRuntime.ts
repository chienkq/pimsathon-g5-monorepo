import {
  executeSingleNode,
  executeWorkflow,
  type ExecuteWorkflowOptions,
  type NodeExecutionResult,
  type WorkflowExecutionResult,
} from "../engine/executeWorkflow.js";
import { listNodeTypeMetas } from "../nodeTypes/index.js";
import type { NodeExecutionData, NodeTypeMeta, WorkflowDefinition } from "../types.js";

/** One row of a workflow's run history — the Run Logs panel's list view. */
export interface WorkflowRunSummary {
  id: string;
  status: "running" | "success" | "error";
  trigger: "schedule" | "webhook" | "manual";
  startedAt: string;
  finishedAt?: string;
  error?: string;
}

/** A single run's full per-node output — the Run Logs panel's detail view. */
export interface WorkflowRunDetail extends WorkflowRunSummary {
  nodeResults: Record<string, NodeExecutionResult>;
}

/** Minimal project shape for populating a "Project Id" field's autosuggest — not the full admin-ui `Project` record. */
export interface WorkflowRuntimeProjectSummary {
  id: string;
  name: string;
  code: string;
}

/**
 * Where the node type list comes from and where a workflow actually runs. Mirrors
 * `WorkflowRepository`'s swap-in pattern: `LocalWorkflowRuntime` (the default, no real integrations)
 * for a standalone/localStorage setup, an HTTP-backed one when a real backend exists.
 */
export interface WorkflowRuntime {
  listNodeTypes(): Promise<NodeTypeMeta[]>;
  run(
    workflow: WorkflowDefinition,
    options?: Pick<ExecuteWorkflowOptions, "onNodeStart" | "onNodeFinish">
  ): Promise<WorkflowExecutionResult>;
  /** Optional — the Run Logs panel only renders its trigger button when a runtime implements this. */
  listRuns?(workflowId: string): Promise<WorkflowRunSummary[]>;
  getRun?(workflowId: string, runId: string): Promise<WorkflowRunDetail | undefined>;
  /** Optional — the NDV "Execute" button only renders when a runtime implements this. */
  runNode?(
    nodeType: string,
    parameters: Record<string, unknown>,
    input: NodeExecutionData[]
  ): Promise<NodeExecutionResult>;
  /** Optional — powers a "Project Id" field's autosuggest (see `FilterFieldOption.dynamicValueOptions`); absent/empty under `LocalWorkflowRuntime`, which has no real project data. */
  listProjects?(): Promise<WorkflowRuntimeProjectSummary[]>;
}

/**
 * Runs entirely in-process against the local `nodeTypeRegistry` — no `services` are injected, so
 * app-integration nodes (Jira, Git, Slack, ...) no-op/stub rather than hitting real APIs. This is
 * what running standalone (no backend) gets; an HTTP-backed `WorkflowRuntime` that executes against
 * a real backend with real credentials is a separate, opt-in implementation.
 */
export class LocalWorkflowRuntime implements WorkflowRuntime {
  /** Keyed by workflowId, most recent run last — kept only in-memory, so it resets on page reload. */
  private runsByWorkflow = new Map<string, WorkflowRunDetail[]>();

  async listNodeTypes(): Promise<NodeTypeMeta[]> {
    return listNodeTypeMetas();
  }

  async run(
    workflow: WorkflowDefinition,
    options?: Pick<ExecuteWorkflowOptions, "onNodeStart" | "onNodeFinish">
  ): Promise<WorkflowExecutionResult> {
    const result = await executeWorkflow(workflow, options);
    const run: WorkflowRunDetail = {
      id: crypto.randomUUID(),
      status: result.status,
      trigger: "manual",
      startedAt: result.startedAt,
      finishedAt: result.finishedAt,
      nodeResults: result.nodeResults,
    };
    const runs = this.runsByWorkflow.get(workflow.id) ?? [];
    runs.push(run);
    this.runsByWorkflow.set(workflow.id, runs);
    return result;
  }

  async listRuns(workflowId: string): Promise<WorkflowRunSummary[]> {
    return (this.runsByWorkflow.get(workflowId) ?? [])
      .map(({ id, status, trigger, startedAt, finishedAt, error }) => ({
        id,
        status,
        trigger,
        startedAt,
        finishedAt,
        error,
      }))
      .reverse();
  }

  async getRun(workflowId: string, runId: string): Promise<WorkflowRunDetail | undefined> {
    return this.runsByWorkflow.get(workflowId)?.find((run) => run.id === runId);
  }

  async runNode(
    nodeType: string,
    parameters: Record<string, unknown>,
    input: NodeExecutionData[]
  ): Promise<NodeExecutionResult> {
    return executeSingleNode(nodeType, parameters, input);
  }
}
