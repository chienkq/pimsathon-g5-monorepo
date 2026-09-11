import type { NodeExecutionResult, NodeRunStatus } from "@chienkq/workflow-core";
import type { Edge, Node } from "@xyflow/react";

export interface WorkflowNodeData extends Record<string, unknown> {
  nodeType: string;
  label: string;
  parameters: Record<string, unknown>;
  status?: NodeRunStatus | "running";
  result?: NodeExecutionResult;
  disabled?: boolean;
  /** Config-time validation issues (missing required params, invalid JSON) — injected by the canvas. */
  issues?: string[];
  /** Output branch names that already have an outgoing connection (injected by the canvas). */
  connectedOutputs?: string[];
  /** Injected by the canvas: open the add-node panel pre-wired to connect from this output. */
  onAddFromOutput?: (output: string) => void;
  /** Injected by the canvas: node hover-toolbar actions. */
  onDelete?: () => void;
  onToggleDisabled?: () => void;
}

export interface WorkflowEdgeData extends Record<string, unknown> {
  onDelete?: (edgeId: string) => void;
}

export interface AddNodeRequest {
  mode: "trigger" | "node";
  sourceNodeId?: string;
  sourceOutput?: string;
}

/** Which face of the Run Logs panel is open — `"list"` the run history, or one run's detail. Deep-linkable via URL by the host app. */
export type RunLogsView = "list" | { runId: string };

export type WorkflowFlowNode = Node<WorkflowNodeData, "workflowNode">;
export type WorkflowFlowEdge = Edge<WorkflowEdgeData, "workflowEdge">;
