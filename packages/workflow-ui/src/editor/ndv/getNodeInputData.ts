import type { NodeExecuteInputGroup, NodeExecutionData } from "@chienkq/workflow-core";
import type { WorkflowFlowEdge, WorkflowFlowNode } from "../types.js";

/**
 * Assigns each incoming edge to one of `inputHandles`, mirroring `executeWorkflow`'s server-side
 * logic exactly: an edge whose `targetHandle` names one of the node's *current* declared handles
 * goes straight there; everything else (no handle recorded, or one the node no longer declares —
 * e.g. a `merge` connection saved back when it only had a single "main" input, before it grew
 * "input1"/"input2") is treated as unassigned and distributed across the remaining handles in
 * order, with any leftover appended to the last handle. Without this, such a legacy edge's literal
 * `targetHandle` ("main") collides with another legacy edge's, folding both sources into one group
 * instead of splitting them across the node's real inputs.
 */
function assignEdgesToHandles(edges: WorkflowFlowEdge[], inputHandles: string[]): Map<string, WorkflowFlowEdge[]> {
  const byHandle = new Map<string, WorkflowFlowEdge[]>();
  const unassigned: WorkflowFlowEdge[] = [];
  for (const edge of edges) {
    const handle = edge.targetHandle;
    if (handle && inputHandles.includes(handle)) {
      byHandle.set(handle, [...(byHandle.get(handle) ?? []), edge]);
    } else {
      unassigned.push(edge);
    }
  }
  for (const handle of inputHandles) {
    if (byHandle.has(handle)) continue;
    const edge = unassigned.shift();
    if (!edge) break;
    byHandle.set(handle, [edge]);
  }
  if (unassigned.length > 0) {
    const lastHandle = inputHandles[inputHandles.length - 1];
    byHandle.set(lastHandle, [...(byHandle.get(lastHandle) ?? []), ...unassigned]);
  }
  return byHandle;
}

/**
 * Re-derives a node's input items on the client from its upstream nodes' stored results, grouped by
 * which of the node's own input handles each connection feeds (e.g. `merge`'s "input1"/"input2") —
 * mirrors the same branch-collection logic `executeWorkflow` uses server-side, so the NDV can show
 * "what this node received, per input" without the engine persisting per-node input snapshots.
 * Nodes with a single (or default "main") input handle get one key back.
 */
export function getNodeInputDataByHandle(
  nodeId: string,
  nodes: WorkflowFlowNode[],
  edges: WorkflowFlowEdge[],
  inputHandles: string[] = ["main"]
): Record<string, NodeExecutionData[]> {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const incoming = edges.filter((edge) => edge.target === nodeId);
  const assigned = assignEdgesToHandles(incoming, inputHandles);

  const byHandle: Record<string, NodeExecutionData[]> = {};
  for (const [handle, handleEdges] of assigned) {
    for (const edge of handleEdges) {
      const source = nodesById.get(edge.source);
      const upstreamResult = source?.data.result;
      if (!upstreamResult || upstreamResult.status !== "success") continue;
      const branchKey = edge.sourceHandle ?? "main";
      const items = upstreamResult.branches?.[branchKey] ?? [];
      byHandle[handle] = [...(byHandle[handle] ?? []), ...items];
    }
  }
  return byHandle;
}

/** Flattened form of {@link getNodeInputDataByHandle}, for callers that don't care which input handle an item came from (e.g. running a node in isolation). */
export function getNodeInputData(
  nodeId: string,
  nodes: WorkflowFlowNode[],
  edges: WorkflowFlowEdge[]
): NodeExecutionData[] {
  return Object.values(getNodeInputDataByHandle(nodeId, nodes, edges)).flat();
}

/**
 * {@link NodeExecuteInputGroup}[] form of {@link getNodeInputDataByHandle} — what a node type's
 * `execute()` actually reads to tell its inputs apart (e.g. `merge`'s "combine" mode keys its output
 * by each group's `sourceNodeName`). One group per incoming *connection* (not per handle) — a node
 * with a single "main" handle fed by two edges still gets each upstream node's items kept separate
 * and tagged by its own name, instead of merged into one indistinguishable group. Mirrors
 * `executeWorkflow`'s per-connection grouping so a single-node "Execute" run in the NDV behaves the
 * same as running it inside the full workflow.
 */
export function getNodeInputGroups(
  nodeId: string,
  nodes: WorkflowFlowNode[],
  edges: WorkflowFlowEdge[],
  inputHandles: string[] = ["main"]
): NodeExecuteInputGroup[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const incoming = edges.filter((edge) => edge.target === nodeId);
  const assigned = assignEdgesToHandles(incoming, inputHandles);

  return inputHandles.flatMap((handle) =>
    (assigned.get(handle) ?? []).map((edge) => {
      const source = nodesById.get(edge.source);
      const upstreamResult = source?.data.result;
      const branchKey = edge.sourceHandle ?? "main";
      const items: NodeExecutionData[] =
        upstreamResult?.status === "success" ? (upstreamResult.branches?.[branchKey] ?? []) : [];
      return { sourceNodeName: source?.data.label ?? edge.source, items };
    })
  );
}

/** Every node transitively upstream of `nodeId`, found by walking `edges` backward — not just its
 *  direct predecessor(s). Shared by `runNodeWithUpstream` (which node) and the expression node
 *  picker / `getAncestorNodeContext` (which node output values are reachable). */
export function getAncestorNodes(
  nodeId: string,
  nodes: WorkflowFlowNode[],
  edges: WorkflowFlowEdge[]
): WorkflowFlowNode[] {
  const ancestorIds = new Set<string>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    for (const edge of edges) {
      if (edge.target === current && !ancestorIds.has(edge.source)) {
        ancestorIds.add(edge.source);
        queue.push(edge.source);
      }
    }
  }
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  return [...ancestorIds].map((id) => nodesById.get(id)).filter((node): node is WorkflowFlowNode => !!node);
}

/**
 * Node name -> that ancestor's first output item's json, for every transitive ancestor of `nodeId`
 * that has a stored successful result — what `$node["Name"].json.path` expressions resolve against,
 * so a parameter can reach any upstream node's output, not just its own direct predecessor's.
 */
export function getAncestorNodeContext(
  nodeId: string,
  nodes: WorkflowFlowNode[],
  edges: WorkflowFlowEdge[]
): Record<string, Record<string, unknown>> {
  const context: Record<string, Record<string, unknown>> = {};
  for (const ancestor of getAncestorNodes(nodeId, nodes, edges)) {
    const result = ancestor.data.result;
    if (!result || result.status !== "success") continue;
    const items = Object.values(result.branches ?? {}).flat();
    context[ancestor.data.label] = items[0]?.json ?? {};
  }
  return context;
}
