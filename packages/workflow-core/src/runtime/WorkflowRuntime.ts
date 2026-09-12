import {
  executeSingleNode,
  executeWorkflow,
  type ExecuteWorkflowOptions,
  type NodeExecutionResult,
  type WorkflowExecutionResult,
} from "../engine/executeWorkflow.js";
import { listNodeTypeMetas } from "../nodeTypes/index.js";
import type { NodeExecuteInputGroup, NodeExecutionData, NodeTypeMeta, WorkflowDefinition } from "../types.js";

/** One row of a workflow's run history — the Run Logs panel's list view. */
export interface WorkflowRunSummary {
  id: string;
  status: "running" | "success" | "error" | "cancelled";
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

/** Minimal AI Agent shape for populating the "Send Message to Agent" node's Agent dropdown — not the full ai_agents row (no markdown/tools/llmConfigId, which the node never needs client-side). */
export interface WorkflowRuntimeAiAgentSummary {
  id: string;
  name: string;
}

/**
 * Where the node type list comes from and where a workflow actually runs. Mirrors
 * `WorkflowRepository`'s swap-in pattern: `LocalWorkflowRuntime` (the default, no real integrations)
 * for a standalone/localStorage setup, an HTTP-backed one when a real backend exists.
 */
export interface RunWorkflowOptions extends Pick<ExecuteWorkflowOptions, "onNodeStart" | "onNodeFinish"> {
  /** Fired as soon as the run has an id — before it necessarily starts executing — so the caller can
   *  hold onto it for a later `cancel(runId)`. */
  onRunStart?: (runId: string) => void;
}

export interface WorkflowRuntime {
  listNodeTypes(): Promise<NodeTypeMeta[]>;
  run(workflow: WorkflowDefinition, options?: RunWorkflowOptions): Promise<WorkflowExecutionResult>;
  /** Optional — a runtime that can't cooperatively stop an in-flight run (e.g. none exists yet) just
   *  omits this; the Stop button only renders when a runtime implements it. */
  cancel?(runId: string): Promise<void>;
  /** Optional — the Run Logs panel only renders its trigger button when a runtime implements this. */
  listRuns?(workflowId: string): Promise<WorkflowRunSummary[]>;
  getRun?(workflowId: string, runId: string): Promise<WorkflowRunDetail | undefined>;
  /** Optional — the NDV "Execute" button only renders when a runtime implements this. `signal`, when
   *  given, lets the caller (the NDV's Stop button) abort the in-flight call. `inputs`, when given,
   *  carries the node's input items grouped by which input handle they arrived on (e.g. `merge`'s
   *  "input1"/"input2") — without it a multi-input node can't tell its inputs apart (e.g. `merge`'s
   *  "combine" mode would fold every handle's items into one group). `nodeContext`, when given, maps
   *  an ancestor node's name to its first output item's json, so this node's expressions can reach
   *  `$node["Name"].json.path` for any ancestor, not just its own direct-predecessor input. */
  runNode?(
    nodeType: string,
    parameters: Record<string, unknown>,
    input: NodeExecutionData[],
    signal?: AbortSignal,
    inputs?: NodeExecuteInputGroup[],
    nodeContext?: Record<string, Record<string, unknown>>
  ): Promise<NodeExecutionResult>;
  /** Optional — powers a "Project Id" field's autosuggest (see `FilterFieldOption.dynamicValueOptions`); absent/empty under `LocalWorkflowRuntime`, which has no real project data. */
  listProjects?(): Promise<WorkflowRuntimeProjectSummary[]>;
  /** Optional — powers "Send Message to Agent"'s Agent dropdown (see `ParameterField.dynamicOptions`); absent/empty under `LocalWorkflowRuntime`, which has no real AI Agent catalog. */
  listAiAgents?(): Promise<WorkflowRuntimeAiAgentSummary[]>;
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
  /** In-flight runs' abort controllers, keyed by run id — entries are removed once the run settles. */
  private controllersByRunId = new Map<string, AbortController>();

  async listNodeTypes(): Promise<NodeTypeMeta[]> {
    return listNodeTypeMetas();
  }

  async run(workflow: WorkflowDefinition, options?: RunWorkflowOptions): Promise<WorkflowExecutionResult> {
    const runId = crypto.randomUUID();
    const controller = new AbortController();
    this.controllersByRunId.set(runId, controller);
    options?.onRunStart?.(runId);

    let result: WorkflowExecutionResult;
    try {
      result = await executeWorkflow(workflow, { ...options, signal: controller.signal });
    } finally {
      this.controllersByRunId.delete(runId);
    }

    const run: WorkflowRunDetail = {
      id: runId,
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

  async cancel(runId: string): Promise<void> {
    this.controllersByRunId.get(runId)?.abort();
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
    input: NodeExecutionData[],
    _signal?: AbortSignal,
    inputs?: NodeExecuteInputGroup[],
    nodeContext?: Record<string, Record<string, unknown>>
  ): Promise<NodeExecutionResult> {
    // No real I/O happens in-process here (services are stubbed), so there's nothing a `signal`
    // could usefully abort mid-flight — accepted on the interface for the HTTP runtime's sake only.
    return executeSingleNode(nodeType, parameters, input, undefined, inputs, nodeContext);
  }
}
