import {
  executeWorkflow,
  type ExecuteWorkflowOptions,
  type WorkflowExecutionResult,
} from "../engine/executeWorkflow.js";
import { listNodeTypeMetas } from "../nodeTypes/index.js";
import type { NodeTypeMeta, WorkflowDefinition } from "../types.js";

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
}

/**
 * Runs entirely in-process against the local `nodeTypeRegistry` — no `services` are injected, so
 * app-integration nodes (Jira, Git, Slack, ...) no-op/stub rather than hitting real APIs. This is
 * what running standalone (no backend) gets; an HTTP-backed `WorkflowRuntime` that executes against
 * a real backend with real credentials is a separate, opt-in implementation.
 */
export class LocalWorkflowRuntime implements WorkflowRuntime {
  async listNodeTypes(): Promise<NodeTypeMeta[]> {
    return listNodeTypeMetas();
  }

  async run(
    workflow: WorkflowDefinition,
    options?: Pick<ExecuteWorkflowOptions, "onNodeStart" | "onNodeFinish">
  ): Promise<WorkflowExecutionResult> {
    return executeWorkflow(workflow, options);
  }
}
