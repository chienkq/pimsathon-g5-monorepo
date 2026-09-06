import type { NodeExecutionResult, NodeRunStatus } from "@chienkq/workflow-core";
import type { Edge, Node } from "@xyflow/react";

export interface WorkflowNodeData extends Record<string, unknown> {
  nodeType: string;
  label: string;
  parameters: Record<string, unknown>;
  status?: NodeRunStatus | "running";
  result?: NodeExecutionResult;
}

export type WorkflowFlowNode = Node<WorkflowNodeData, "workflowNode">;
export type WorkflowFlowEdge = Edge;
