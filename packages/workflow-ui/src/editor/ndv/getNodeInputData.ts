import type { NodeExecutionData } from "@chienkq/workflow-core";
import type { WorkflowFlowEdge, WorkflowFlowNode } from "../types.js";

/**
 * Re-derives a node's input items on the client from its upstream nodes' stored results — mirrors
 * the same branch-collection logic `executeWorkflow` uses server-side, so the NDV can show
 * "what this node received" without the engine persisting per-node input snapshots.
 */
export function getNodeInputData(
  nodeId: string,
  nodes: WorkflowFlowNode[],
  edges: WorkflowFlowEdge[]
): NodeExecutionData[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const incoming = edges.filter((edge) => edge.target === nodeId);

  return incoming.flatMap((edge) => {
    const source = nodesById.get(edge.source);
    const upstreamResult = source?.data.result;
    if (!upstreamResult || upstreamResult.status !== "success") return [];
    const branchKey = edge.sourceHandle ?? "main";
    return upstreamResult.branches?.[branchKey] ?? [];
  });
}
